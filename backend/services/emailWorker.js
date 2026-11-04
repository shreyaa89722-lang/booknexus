const EmailOutbox = require("../models/emailOutbox");
const Notification = require("../models/notification");
const emailService = require("./emailService");
const { renderTemplate } = require("./emailTemplates");

let workerTimer = null;
let isProcessing = false;
let isRunning = false;

/**
 * Reclaims jobs stuck in 'processing' state (e.g. due to server crash/restart)
 */
async function reclaimStalledJobs(stalledMinutes = 10) {
  try {
    const cutoff = new Date(Date.now() - stalledMinutes * 60 * 1000);
    const result = await EmailOutbox.updateMany(
      { status: "processing", updatedAt: { $lte: cutoff } },
      { $set: { status: "pending", lastError: "Reclaimed from stalled worker processing state" } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[EmailWorker] 🔄 Reclaimed ${result.modifiedCount} stalled outbox jobs.`);
    }
  } catch (err) {
    console.warn("[EmailWorker] Reclaim notice:", err.message);
  }
}

/**
 * Dispatches a single claimed job document through provider and records delivery state
 */
async function processJob(job) {
  if (!job) return null;
  try {
    // 1. Render template
    const { subject, html, text } = renderTemplate(job.templateName, job.templateData);

    // 2. Deliver via configured provider (Resend / SMTP / Simulated)
    const result = await emailService.sendRawEmail({
      to: job.recipientEmailSnapshot,
      subject: subject,
      html: html,
      text: text,
      tags: [
        { name: "event_type", value: job.eventType.replace(/[^a-zA-Z0-9_-]/g, "_") },
        { name: "outbox_id", value: job._id.toString() },
      ],
    });

    if (result.success) {
      job.attemptCount = (job.attemptCount || 0) + 1;
      // 3. Mark Outbox as Sent
      job.status = "sent";
      job.provider = result.provider || "resend";
      job.providerMessageId = result.messageId || null;
      job.sentAt = new Date();
      job.renderedSubject = subject;
      job.deliveryEvents.push({
        status: "sent",
        timestamp: new Date(),
        details: { provider: result.provider, messageId: result.messageId },
      });
      await job.save();

      console.log(`[EmailWorker] ✅ Successfully dispatched job ${job._id} (MsgID: ${result.messageId})`);

      // 4. Mirror in user's in-app notification center
      try {
        await Notification.create({
          user: job.recipientUserId,
          userEmail: job.recipientEmailSnapshot,
          type: job.eventType.includes("sign_in") || job.eventType.includes("login") ? "sign_in" : "general",
          title: subject,
          subject: subject,
          preview: subject,
          html: html,
          deliveryStatus: result.simulated ? "simulated" : "sent",
          messageId: result.messageId || null,
        });
      } catch (notifErr) {
        console.warn("[EmailWorker] In-app notification mirror note:", notifErr.message);
      }

      return { status: "sent", job };
    } else {
      // Handle provider delivery failure with exponential backoff
      job.attemptCount += 1;
      job.lastError = result.error || "Unknown provider failure";
      job.deliveryEvents.push({
        status: "attempt_failed",
        timestamp: new Date(),
        details: { attempt: job.attemptCount, error: result.error },
      });

      const isPermanentError =
        typeof result.error === "string" &&
        (result.error.toLowerCase().includes("invalid recipient") ||
          result.error.toLowerCase().includes("does not exist") ||
          result.error.toLowerCase().includes("blocked"));

      if (job.attemptCount >= job.maxAttempts || isPermanentError) {
        job.status = "failed";
        console.error(`[EmailWorker] ❌ Permanent failure for job ${job._id} after ${job.attemptCount} attempts: ${job.lastError}`);
      } else {
        // Exponential backoff: 1min, 2min, 4min, 8min...
        const backoffMs = Math.min(Math.pow(2, job.attemptCount) * 60 * 1000, 24 * 60 * 60 * 1000);
        job.status = "pending";
        job.scheduledAt = new Date(Date.now() + backoffMs);
        console.warn(`[EmailWorker] ⚠️ Retry #${job.attemptCount} scheduled for job ${job._id} in ${backoffMs / 1000}s`);
      }

      await job.save();
      return { status: job.status, error: result.error, job };
    }
  } catch (procErr) {
    console.error(`[EmailWorker] 💥 Unexpected error processing job ${job._id}:`, procErr.message);
    job.attemptCount += 1;
    const backoffMs = Math.min(Math.pow(2, job.attemptCount) * 60 * 1000, 24 * 60 * 60 * 1000);
    job.status = job.attemptCount >= job.maxAttempts ? "failed" : "pending";
    job.scheduledAt = new Date(Date.now() + backoffMs);
    job.lastError = procErr.message;
    await job.save();
    return { status: "error", error: procErr.message, job };
  }
}

/**
 * Processes a single pending job from the Outbox using atomic locking
 */
async function processNextJob() {
  const now = new Date();

  // Atomic claim: only one worker instance can transition a given job from 'pending' to 'processing'
  const job = await EmailOutbox.findOneAndUpdate(
    {
      status: "pending",
      scheduledAt: { $lte: now },
      attemptCount: { $lt: 5 },
    },
    {
      $set: { status: "processing" },
    },
    { new: true, sort: { scheduledAt: 1, createdAt: 1 } }
  );

  if (!job) return null; // No pending work

  console.log(`[EmailWorker] ⚡ Claimed job ${job._id} (${job.eventType}) for <${job.recipientEmailSnapshot}>`);
  return processJob(job);
}

/**
 * Runs a batch pass to process available queued jobs
 */
async function processBatch(batchSize = 10) {
  if (isProcessing) return;
  isProcessing = true;
  try {
    let processed = 0;
    while (processed < batchSize) {
      const outcome = await processNextJob();
      if (!outcome) break; // Queue drained
      processed++;
    }
  } catch (err) {
    console.warn("[EmailWorker] Batch pass warning:", err.message);
  } finally {
    isProcessing = false;
  }
}

/**
 * Triggers immediate processing (e.g. when a new event was queued)
 */
async function triggerImmediateProcessing() {
  return processBatch(5);
}

/**
 * Starts the background worker loop
 */
function startEmailWorker(pollIntervalMs = 5000) {
  if (isRunning) return;
  isRunning = true;
  console.log(`[EmailWorker] 🚀 Background email worker active (polling every ${pollIntervalMs / 1000}s).`);

  // Initial reclaim & sweep
  reclaimStalledJobs().catch(() => {});
  processBatch().catch(() => {});

  workerTimer = setInterval(() => {
    processBatch().catch((err) => {
      console.warn("[EmailWorker] Interval tick warning:", err.message);
    });
  }, pollIntervalMs);
}

/**
 * Stops the background worker cleanly
 */
function stopEmailWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
  isRunning = false;
  console.log("[EmailWorker] 🛑 Background email worker stopped.");
}

module.exports = {
  processJob,
  processNextJob,
  processBatch,
  triggerImmediateProcessing,
  reclaimStalledJobs,
  startEmailWorker,
  stopEmailWorker,
};
