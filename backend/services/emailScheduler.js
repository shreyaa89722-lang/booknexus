const Rental = require("../models/Rental");
const Transaction = require("../models/transaction");
const User = require("../models/User");
const Book = require("../models/Book");
const emailEventService = require("./emailEventService");

let schedulerTimer = null;
let isScanning = false;

/**
 * Scans active rentals for upcoming due dates (2 days before, 1 day before, and due today)
 */
async function scanUpcomingDueDates() {
  const now = new Date();
  const fortyEightHoursAhead = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Active loans with future due dates within 48h
  const upcomingRentals = await Rental.find({
    status: { $in: ["approved", "received"] },
    dueDate: { $gte: now, $lte: fortyEightHoursAhead },
  }).populate("book renter");

  let dispatched = 0;
  for (const rental of upcomingRentals) {
    if (!rental.renter || !rental.book || !rental.dueDate) continue;

    const msUntilDue = new Date(rental.dueDate).getTime() - now.getTime();
    const hoursUntilDue = msUntilDue / (1000 * 60 * 60);

    let daysLeft = 2;
    if (hoursUntilDue <= 12) {
      daysLeft = 0; // Due today
    } else if (hoursUntilDue <= 28) {
      daysLeft = 1; // Due tomorrow
    } else {
      daysLeft = 2; // Due in 2 days
    }

    const res = await emailEventService.onDueDateReminder(rental, rental.renter, rental.book, daysLeft);
    if (res && res.success && !res.duplicate) dispatched++;
  }

  return dispatched;
}

/**
 * Scans active loans that have exceeded their due date without being returned
 */
async function scanOverdueRentals() {
  const now = new Date();

  // Active loans past their due date
  const overdueRentals = await Rental.find({
    status: { $in: ["approved", "received", "overdue"] },
    dueDate: { $lt: now },
  }).populate("book renter");

  let dispatched = 0;
  for (const rental of overdueRentals) {
    if (!rental.renter || !rental.book || !rental.dueDate) continue;

    const msOverdue = now.getTime() - new Date(rental.dueDate).getTime();
    const daysOverdue = Math.max(1, Math.floor(msOverdue / (1000 * 60 * 60 * 24)));
    const finePerDay = 10;
    const totalPenalty = daysOverdue * finePerDay;

    // Update rental status and fine record if needed
    if (rental.status !== "overdue" || rental.penaltyAmount !== totalPenalty) {
      rental.status = "overdue";
      rental.penaltyAmount = totalPenalty;
      await rental.save().catch(() => {});
    }

    const res = await emailEventService.onOverdueNotice(rental, rental.renter, rental.book, {
      daysOverdue,
      finePerDay,
      totalPenalty,
    });
    if (res && res.success && !res.duplicate) dispatched++;
  }

  return dispatched;
}

/**
 * Scans pending requests waiting for librarian or peer owner review > 24 hours
 */
async function scanPendingApprovals() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const staleRequests = await Rental.find({
    status: { $in: ["requested", "pending"] },
    requestDate: { $lte: cutoff },
  }).populate("book renter owner");

  let dispatched = 0;
  for (const rental of staleRequests) {
    if (!rental.book) continue;

    const recipient = rental.owner || (await User.findOne({ role: "admin" }));
    if (!recipient) continue;

    const res = await emailEventService.queueEmailEvent({
      eventType: "rental.pending_approval_reminder",
      category: "rentals",
      recipient,
      relatedRentalId: rental._id,
      relatedBookId: rental.book._id,
      templateName: "pendingApprovalReminder",
      templateData: {
        bookTitle: rental.book.title,
        requesterName: rental.renter ? rental.renter.name : "A student",
      },
      idempotencyKey: `pending_approval:${rental._id}:${new Date().toISOString().slice(0, 10)}`,
    });
    if (res && res.success && !res.duplicate) dispatched++;
  }

  return dispatched;
}

/**
 * Scans pending payments and uncollected fines older than 24 hours
 */
async function scanPendingPayments() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const pendingTxns = await Transaction.find({
    status: "pending",
    createdAt: { $lte: cutoff },
  }).populate("user book");

  let dispatched = 0;
  for (const txn of pendingTxns) {
    if (!txn.user) continue;

    const res = await emailEventService.queueEmailEvent({
      eventType: "payment.pending_reminder",
      category: "due_reminders",
      recipient: txn.user,
      relatedTransactionId: txn._id,
      templateName: "pendingPaymentReminder",
      templateData: {
        amount: txn.amount,
        reason: txn.type.replace(/_/g, " "),
      },
      idempotencyKey: `pending_payment:${txn._id}:${new Date().toISOString().slice(0, 10)}`,
    });
    if (res && res.success && !res.duplicate) dispatched++;
  }

  return dispatched;
}

/**
 * Executes a full scheduler sweep across all reminder types
 */
async function runAllSchedulerChecks() {
  if (isScanning) return;
  isScanning = true;
  try {
    const dueCount = await scanUpcomingDueDates();
    const overdueCount = await scanOverdueRentals();
    const approvalCount = await scanPendingApprovals();
    const paymentCount = await scanPendingPayments();

    const total = dueCount + overdueCount + approvalCount + paymentCount;
    if (total > 0) {
      console.log(`[EmailScheduler] 📬 Reminder sweep queued ${total} scheduled notifications (Due: ${dueCount}, Overdue: ${overdueCount}, Pending Approvals: ${approvalCount}, Pending Payments: ${paymentCount}).`);
    }
  } catch (err) {
    console.warn("[EmailScheduler] Scheduler sweep error:", err.message);
  } finally {
    isScanning = false;
  }
}

/**
 * Starts the scheduled background recurring check
 */
function startEmailScheduler(intervalMs = 60 * 60 * 1000) { // default 1 hour
  if (schedulerTimer) return;
  console.log(`[EmailScheduler] ⏰ Scheduled reminder engine started (running every ${intervalMs / (60 * 1000)}m).`);

  // Initial sweep shortly after boot
  setTimeout(() => {
    runAllSchedulerChecks().catch(() => {});
  }, 10000);

  schedulerTimer = setInterval(() => {
    runAllSchedulerChecks().catch(() => {});
  }, intervalMs);
}

/**
 * Stops the scheduler
 */
function stopEmailScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  console.log("[EmailScheduler] 🛑 Scheduled reminder engine stopped.");
}

module.exports = {
  scanUpcomingDueDates,
  scanOverdueRentals,
  scanPendingApprovals,
  scanPendingPayments,
  sweepUpcomingDueDates: scanUpcomingDueDates,
  sweepOverdueRentals: scanOverdueRentals,
  sweepPendingApprovals: scanPendingApprovals,
  sweepPendingPayments: scanPendingPayments,
  runAllSchedulerChecks,
  startEmailScheduler,
  stopEmailScheduler,
};
