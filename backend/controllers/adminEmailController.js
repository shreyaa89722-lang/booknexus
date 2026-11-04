const asyncHandler = require("express-async-handler");
const EmailOutbox = require("../models/emailOutbox");
const emailService = require("../services/emailService");
const emailWorker = require("../services/emailWorker");

/**
 * @desc   Get email activity outbox logs with filters and pagination
 * @route  GET /api/admin/emails
 * @access Private/Admin
 */
const getEmailActivity = asyncHandler(async (req, res) => {
  const { status, category, search, startDate, endDate, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  if (search) {
    const cleanSearch = search.trim();
    query.$or = [
      { recipientEmailSnapshot: { $regex: cleanSearch, $options: "i" } },
      { recipientNameSnapshot: { $regex: cleanSearch, $options: "i" } },
      { eventType: { $regex: cleanSearch, $options: "i" } },
      { renderedSubject: { $regex: cleanSearch, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await EmailOutbox.countDocuments(query);

  const outboxItems = await EmailOutbox.find(query)
    .select("-templateData.password -templateData.token -templateData.credential")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .populate("recipientUserId", "name email role")
    .populate("relatedRentalId", "status dueDate")
    .populate("relatedBookId", "title author");

  res.json({
    success: true,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    data: outboxItems,
  });
});

/**
 * @desc   Get overall email statistics
 * @route  GET /api/admin/emails/stats
 * @access Private/Admin
 */
const getEmailStats = asyncHandler(async (req, res) => {
  const [total, pending, processing, sent, delivered, failed, bounced] = await Promise.all([
    EmailOutbox.countDocuments(),
    EmailOutbox.countDocuments({ status: "pending" }),
    EmailOutbox.countDocuments({ status: "processing" }),
    EmailOutbox.countDocuments({ status: "sent" }),
    EmailOutbox.countDocuments({ status: "delivered" }),
    EmailOutbox.countDocuments({ status: "failed" }),
    EmailOutbox.countDocuments({ status: "bounced" }),
  ]);

  const domainStatus = await emailService.getDomainStatus();

  res.json({
    success: true,
    stats: {
      total,
      pending,
      processing,
      sent,
      delivered,
      failed,
      bounced,
    },
    provider: {
      activeProvider: process.env.RESEND_API_KEY ? "resend" : "simulated",
      senderEmail: process.env.EMAIL_FROM || "onboarding@resend.dev",
      senderName: process.env.EMAIL_FROM_NAME || "BookNexus",
      replyTo: process.env.EMAIL_REPLY_TO || "support@booknexus.local",
      domainStatus,
    },
  });
});

/**
 * @desc   Retry a failed or stalled email notification
 * @route  POST /api/admin/emails/:id/retry
 * @access Private/Admin
 */
const retryEmail = asyncHandler(async (req, res) => {
  const outbox = await EmailOutbox.findById(req.params.id);
  if (!outbox) {
    res.status(404);
    throw new Error("Email outbox record not found");
  }

  // Reset status to pending and schedule immediately
  outbox.status = "pending";
  outbox.attemptCount = 0;
  outbox.lastError = null;
  outbox.scheduledAt = new Date();
  outbox.deliveryEvents.push({
    status: "admin_retry_requested",
    timestamp: new Date(),
    details: { requestedBy: req.user ? req.user.email : "admin" },
  });
  await outbox.save();

  // Trigger immediate worker processing
  setImmediate(() => {
    emailWorker.triggerImmediateProcessing().catch(() => {});
  });

  res.json({
    success: true,
    message: "Email notification re-queued for delivery",
    data: outbox,
  });
});

module.exports = {
  getEmailActivity,
  getEmailStats,
  retryEmail,
};
