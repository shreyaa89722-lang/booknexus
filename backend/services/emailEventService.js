const crypto = require("crypto");
const User = require("../models/User");
const EmailOutbox = require("../models/emailOutbox");
const emailWorker = require("./emailWorker");
const { isValidEmail } = require("./emailService");

/**
 * Validates and resolves a trusted user document from MongoDB.
 * NEVER trusts frontend-supplied email strings.
 * Resolves strictly from authenticated database records.
 */
async function resolveRecipient(userIdOrDoc) {
  if (!userIdOrDoc) return null;

  let user = null;
  if (typeof userIdOrDoc === "object" && userIdOrDoc._id && userIdOrDoc.email) {
    user = userIdOrDoc;
  } else {
    try {
      user = await User.findById(userIdOrDoc).select("+emailPreferences name email usn role");
    } catch (err) {
      console.warn("[EmailEventService] Error resolving user by ID:", err.message);
      return null;
    }
  }

  if (!user || !user.email) return null;

  const cleanEmail = user.email.toLowerCase().trim();
  if (!isValidEmail(cleanEmail)) {
    console.warn(`[EmailEventService] Resolved user ${user._id} has invalid email: "${cleanEmail}"`);
    return null;
  }

  return {
    _id: user._id,
    name: user.name || cleanEmail.split("@")[0],
    email: cleanEmail,
    role: user.role || "student",
    emailPreferences: user.emailPreferences || {},
  };
}

/**
 * Determines if user preferences permit receiving notifications in the given category.
 * Security alerts and critical transactional receipts cannot be disabled.
 */
function isCategoryAllowedByUser(recipient, category) {
  if (!recipient) return false;
  // Security alerts and official transaction receipts are non-disableable
  if (category === "security" || category === "transactional") {
    return true;
  }

  const prefs = recipient.emailPreferences || {};
  switch (category) {
    case "rentals":
      return prefs.rentalUpdates !== false;
    case "due_reminders":
      return prefs.dueReminders !== false;
    case "announcements":
      return prefs.announcements !== false;
    case "reading":
      return prefs.readingUpdates !== false;
    case "promotional":
      return prefs.promotional === true;
    default:
      return true;
  }
}

/**
 * Computes a deterministic idempotency key for an event
 */
function computeIdempotencyKey(eventType, recipientEmail, referenceId = "", qualifier = "") {
  const seed = `${eventType}:${(recipientEmail || "").toLowerCase().trim()}:${referenceId}:${qualifier}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

/**
 * Queues an email notification event in the MongoDB Outbox.
 * Guarantees idempotency and safe error isolation.
 */
async function queueEmailEvent({
  eventType,
  category = "transactional",
  recipient,
  templateName,
  templateData = {},
  relatedRentalId = null,
  relatedBookId = null,
  relatedTransactionId = null,
  idempotencyKey = null,
  scheduledAt = new Date(),
  immediateTrigger = true,
}) {
  try {
    // 1. Resolve trusted recipient from MongoDB
    const resolvedUser = await resolveRecipient(recipient);
    if (!resolvedUser) {
      console.warn(`[EmailEventService] Dropping event "${eventType}": No valid recipient resolved.`);
      return { success: false, reason: "invalid_or_missing_recipient" };
    }

    // 2. Check user notification preferences
    if (!isCategoryAllowedByUser(resolvedUser, category)) {
      console.log(`[EmailEventService] Skipping event "${eventType}" for <${resolvedUser.email}>: Category "${category}" disabled by user preferences.`);
      return { success: true, skipped: true, reason: "category_disabled_by_preferences" };
    }

    // 3. Compute deterministic idempotency key if not explicitly given
    const key =
      idempotencyKey ||
      computeIdempotencyKey(
        eventType,
        resolvedUser.email,
        relatedRentalId || relatedTransactionId || relatedBookId || "",
        templateData.qualifier || ""
      );

    const eventId = "evt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

    // Inject recipient's name and email snapshot into template data
    const enrichedData = {
      ...templateData,
      name: templateData.name || resolvedUser.name,
      email: resolvedUser.email,
      appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
    };

    // 4. Atomic Outbox insertion
    let outboxEntry = null;
    try {
      outboxEntry = await EmailOutbox.create({
        eventId,
        idempotencyKey: key,
        eventType,
        category,
        recipientUserId: resolvedUser._id,
        recipientEmailSnapshot: resolvedUser.email,
        recipientNameSnapshot: resolvedUser.name,
        relatedRentalId,
        relatedBookId,
        relatedTransactionId,
        templateName,
        templateData: enrichedData,
        status: "pending",
        scheduledAt,
      });
      console.log(`[EmailEventService] 📥 Queued event "${eventType}" for <${resolvedUser.email}> (Key: ${key.slice(0, 12)}...)`);
    } catch (dbErr) {
      // Duplicate idempotency key (code 11000) means event was already queued
      if (dbErr.code === 11000) {
        console.log(`[EmailEventService] ℹ️ Duplicate event suppressed by idempotency key: ${key.slice(0, 16)}...`);
        return { success: true, duplicate: true, reason: "idempotent_duplicate" };
      }
      throw dbErr;
    }

    // 5. Trigger immediate processing by background worker
    if (immediateTrigger && emailWorker && typeof emailWorker.triggerImmediateProcessing === "function") {
      setImmediate(() => {
        emailWorker.triggerImmediateProcessing().catch((wErr) => {
          console.warn("[EmailEventService] Worker trigger notice:", wErr.message);
        });
      });
    }

    return { success: true, outboxId: outboxEntry._id, eventId };
  } catch (error) {
    console.error(`[EmailEventService] ❌ Failed to queue email event "${eventType}":`, error.message);
    // Crucial rule: Email failure must NEVER fail the parent business operation
    return { success: false, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Business Event Triggers
// ---------------------------------------------------------------------------

// A. Account Events
const onUserRegistered = async (user) => {
  return queueEmailEvent({
    eventType: "user.registered",
    category: "transactional",
    recipient: user,
    templateName: "welcome",
    templateData: { name: user.name, email: user.email },
    idempotencyKey: `welcome:${user._id}`,
  });
};

const onUserLogin = async (user, sessionDetails = {}) => {
  return queueEmailEvent({
    eventType: "user.login",
    category: "security",
    recipient: user,
    templateName: "signIn",
    templateData: {
      name: user.name,
      email: user.email,
      time: sessionDetails.time,
      device: sessionDetails.device,
      ip: sessionDetails.ip,
    },
    // Deduplicate rapid subsequent logins within a 5-minute window
    idempotencyKey: computeIdempotencyKey("user.login", user.email, Math.floor(Date.now() / (5 * 60 * 1000))),
  });
};

const onUserLogout = async (user, sessionDetails = {}) => {
  return queueEmailEvent({
    eventType: "user.logout",
    category: "security",
    recipient: user,
    templateName: "signOut",
    templateData: {
      name: user.name,
      email: user.email,
      time: sessionDetails.time || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      device: sessionDetails.device || "Web Browser",
    },
    // Deduplicate within 2-minute window
    idempotencyKey: computeIdempotencyKey("user.logout", user.email, Math.floor(Date.now() / (2 * 60 * 1000))),
  });
};

const onSecurityAlert = async (user, alertDetails = {}) => {
  return queueEmailEvent({
    eventType: "user.security_alert",
    category: "security",
    recipient: user,
    templateName: "securityAlert",
    templateData: alertDetails,
    idempotencyKey: computeIdempotencyKey("user.security_alert", user.email, alertDetails.alertType || "", Math.floor(Date.now() / 60000)),
  });
};

const onProfileUpdated = async (user, updateDetails = {}) => {
  return queueEmailEvent({
    eventType: "user.profile_updated",
    category: "security",
    recipient: user,
    templateName: "profileUpdated",
    templateData: updateDetails,
  });
};

// B. Borrowing & Rental Events
const onBorrowSubmitted = async (rental, renter, book) => {
  return queueEmailEvent({
    eventType: "borrow.submitted",
    category: "rentals",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book._id,
    templateName: "borrowRequestSubmitted",
    templateData: {
      bookTitle: book.title,
      author: book.author,
      rentalId: rental._id.toString(),
    },
    idempotencyKey: `borrow.submitted:${rental._id}`,
  });
};

const onBorrowApproved = async (rental, renter, book) => {
  return queueEmailEvent({
    eventType: "borrow.approved",
    category: "rentals",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book._id,
    templateName: "borrowRequestApproved",
    templateData: {
      bookTitle: book.title,
      author: book.author,
      rentalId: rental._id.toString(),
      pickupOtp: rental.pickupOtp,
      dueDate: rental.dueDate,
    },
    idempotencyKey: `borrow.approved:${rental._id}`,
  });
};

const onBorrowRejected = async (rental, renter, book, reason = "") => {
  return queueEmailEvent({
    eventType: "borrow.rejected",
    category: "rentals",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book ? book._id : null,
    templateName: "borrowRequestRejected",
    templateData: {
      bookTitle: book ? book.title : "Requested Book",
      reason: reason || "Currently unavailable in catalog",
    },
    idempotencyKey: `borrow.rejected:${rental._id}`,
  });
};

const onBorrowCancelled = async (rental, renter, book) => {
  return queueEmailEvent({
    eventType: "borrow.cancelled",
    category: "rentals",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book ? book._id : null,
    templateName: "borrowRequestCancelled",
    templateData: {
      bookTitle: book ? book.title : "Requested Book",
    },
    idempotencyKey: `borrow.cancelled:${rental._id}`,
  });
};

const onRentalStarted = async (rental, renter, book) => {
  return queueEmailEvent({
    eventType: "rental.started",
    category: "rentals",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book._id,
    templateName: "borrowStarted",
    templateData: {
      bookTitle: book.title,
      rentalId: rental._id.toString(),
      dueDate: rental.dueDate,
    },
    idempotencyKey: `rental.started:${rental._id}`,
  });
};

const onDueDateReminder = async (rental, renter, book, daysLeft) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  return queueEmailEvent({
    eventType: "rental.due_reminder",
    category: "due_reminders",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book._id,
    templateName: "dueDateReminder",
    templateData: {
      bookTitle: book.title,
      daysLeft,
      dueDate: rental.dueDate,
    },
    idempotencyKey: `rental.due_reminder:${rental._id}:${daysLeft}:${dateStr}`,
  });
};

const onOverdueNotice = async (rental, renter, book, fineDetails = {}) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  return queueEmailEvent({
    eventType: "rental.overdue",
    category: "due_reminders",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book._id,
    templateName: "overdueNotice",
    templateData: {
      bookTitle: book.title,
      daysOverdue: fineDetails.daysOverdue || 3,
      finePerDay: fineDetails.finePerDay || 10,
      totalPenalty: fineDetails.totalPenalty || 30,
      dueDate: rental.dueDate,
    },
    idempotencyKey: `rental.overdue:${rental._id}:${dateStr}`,
  });
};

const onReturnRequested = async (rental, renter, book) => {
  return queueEmailEvent({
    eventType: "rental.return_requested",
    category: "rentals",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book._id,
    templateName: "returnRequested",
    templateData: {
      bookTitle: book.title,
    },
    idempotencyKey: `rental.return_requested:${rental._id}`,
  });
};

const onReturnConfirmed = async (rental, renter, book) => {
  return queueEmailEvent({
    eventType: "rental.return_confirmed",
    category: "rentals",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book._id,
    templateName: "returnConfirmed",
    templateData: {
      bookTitle: book.title,
      rentalId: rental._id.toString(),
    },
    idempotencyKey: `rental.return_confirmed:${rental._id}`,
  });
};

const onRentalCompleted = async (rental, renter, book, details = {}) => {
  return queueEmailEvent({
    eventType: "rental.completed",
    category: "rentals",
    recipient: renter,
    relatedRentalId: rental._id,
    relatedBookId: book._id,
    templateName: "rentalCompleted",
    templateData: {
      bookTitle: book.title,
      rentalId: rental._id.toString(),
      depositRefunded: details.depositRefunded || 0,
      txHash: details.txHash || rental.returnTxHash,
    },
    idempotencyKey: `rental.completed:${rental._id}`,
  });
};

// C. Payment & Transaction Events (Independently Verified Server-Side)
const onPaymentSuccess = async (transaction, user, book = {}) => {
  return queueEmailEvent({
    eventType: "payment.success",
    category: "transactional",
    recipient: user,
    relatedTransactionId: transaction._id,
    relatedRentalId: transaction.rental,
    relatedBookId: book._id || transaction.book,
    templateName: "paymentSuccess",
    templateData: {
      transactionRef: transaction.transactionRef,
      purpose: transaction.type,
      amount: transaction.amount,
      bookTitle: book.title || "Academic Materials",
    },
    idempotencyKey: `payment.success:${transaction.transactionRef}`,
  });
};

const onTransactionReceipt = async (transaction, user, book = {}) => {
  return queueEmailEvent({
    eventType: "transaction.receipt",
    category: "transactional",
    recipient: user,
    relatedTransactionId: transaction._id,
    relatedRentalId: transaction.rental,
    relatedBookId: book._id || transaction.book,
    templateName: "transactionReceipt",
    templateData: {
      transactionRef: transaction.transactionRef,
      type: transaction.type,
      amount: transaction.amount,
      bookTitle: book.title || "Academic Materials",
      paymentMethod: transaction.paymentMethod,
      date: new Date(transaction.verifiedAt || transaction.createdAt).toLocaleString("en-IN"),
    },
    idempotencyKey: `transaction.receipt:${transaction.transactionRef}`,
  });
};

const onPaymentFailed = async (transaction, user, book = {}, reason = "") => {
  return queueEmailEvent({
    eventType: "payment.failed",
    category: "transactional",
    recipient: user,
    relatedTransactionId: transaction._id,
    templateName: "paymentFailed",
    templateData: {
      amount: transaction.amount,
      reason: reason || "Payment not authorized or cancelled",
    },
    idempotencyKey: `payment.failed:${transaction.transactionRef || Date.now()}`,
  });
};

const onRefundCompleted = async (transaction, user, book = {}) => {
  return queueEmailEvent({
    eventType: "payment.refund_completed",
    category: "transactional",
    recipient: user,
    relatedTransactionId: transaction._id,
    templateName: "refundCompleted",
    templateData: {
      transactionRef: transaction.transactionRef,
      amount: transaction.amount,
    },
    idempotencyKey: `payment.refund_completed:${transaction.transactionRef}`,
  });
};

module.exports = {
  resolveRecipient,
  isCategoryAllowedByUser,
  isCategoryAllowed: isCategoryAllowedByUser,
  computeIdempotencyKey,
  queueEmailEvent,
  // Triggers
  onUserRegistered,
  onUserLogin,
  onUserLogout,
  onSecurityAlert,
  onProfileUpdated,
  onBorrowSubmitted,
  onBorrowApproved,
  onBorrowRejected,
  onBorrowCancelled,
  onRentalStarted,
  onDueDateReminder,
  onOverdueNotice,
  onReturnRequested,
  onReturnConfirmed,
  onRentalCompleted,
  onPaymentSuccess,
  onTransactionReceipt,
  onPaymentFailed,
  onRefundCompleted,
};
