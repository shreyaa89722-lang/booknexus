const asyncHandler = require("express-async-handler");
const Notification = require("../models/notification");
const emailService = require("../services/emailService");

// @desc   Get user notifications
// @route  GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const userEmail = (req.user && req.user.email ? req.user.email : (req.query.email || "")).toLowerCase().trim();

  let notifications = [];
  try {
    if (userEmail) {
      notifications = await Notification.find({
        $or: [
          { userEmail: userEmail },
          ...(req.user && req.user._id ? [{ user: req.user._id }] : [])
        ]
      }).sort({ createdAt: -1 }).limit(50);
    } else if (req.user && (req.user.role === "admin" || req.user.role === "librarian")) {
      notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    } else {
      notifications = [];
    }
  } catch (err) {
    console.warn("Notification find notice:", err.message);
  }

  // Fallback to in-memory buffer ONLY if matching this specific user's email
  if (notifications.length === 0 && emailService.recentNotifications.length > 0 && userEmail) {
    notifications = emailService.recentNotifications.filter(n => n.userEmail === userEmail);
  }

  res.json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

// @desc   Trigger all 8 lifecycle email notifications for testing
// @route  POST /api/notifications/test-all
const testAllNotifications = asyncHandler(async (req, res) => {
  const targetEmail = (req.body.email || (req.user && req.user.email) || "").toLowerCase().trim();
  if (!targetEmail) {
    res.status(400);
    throw new Error("Recipient email address is required");
  }
  const userName = req.body.name || (req.user && req.user.name) || targetEmail.split("@")[0];
  const userObj = { _id: req.user ? req.user._id : null, name: userName, email: targetEmail };

  const sampleBook = {
    _id: "6ade0fd7fdc925bc8d82671d",
    title: "Database System Concepts (7th Edition)",
    author: "Abraham Silberschatz & Henry F. Korth",
    rentalPrice: 50,
    listingType: "rental"
  };

  const sampleRental = {
    _id: "6ade0fd7fdc925bc8d82671d",
    pickupOtp: "849201",
    requestDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 86400000),
    receivedDate: new Date(),
    returnDate: new Date(),
    returnTxHash: "0x4b7891a27e36819a84b01982cf91a0b3c81e9f1a238491029c8192a0194829bc"
  };

  const triggered = [];

  // 1. Sign-In
  const n1 = await emailService.sendSignInNotification(userObj, {
    time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }),
    device: req.headers["user-agent"] || "Chrome Desktop (Windows)",
    ip: req.ip || "127.0.0.1"
  });
  triggered.push({ type: "sign_in", title: "1. Sign-In Notification", result: n1 });

  // 2. Buying / Renting the Book
  const n2 = await emailService.sendBookBuyingNotification(userObj, sampleBook, sampleRental);
  triggered.push({ type: "book_buying", title: "2. Buying / Renting the Book", result: n2 });

  // 3. Pending Status
  const n3 = await emailService.sendPendingNotification(userObj, sampleBook, sampleRental);
  triggered.push({ type: "pending", title: "3. Pending Status Notification", result: n3 });

  // 4. Accepted the Book
  const n4 = await emailService.sendBookAcceptedNotification(userObj, sampleBook, sampleRental);
  triggered.push({ type: "accepted", title: "4. Accepted the Book", result: n4 });

  // 5. Dedicated OTP
  const n5 = await emailService.sendOtpNotification(userObj, "849201", "Physical Handover Counter Pickup", {
    bookTitle: sampleBook.title,
    expiryMinutes: 15
  });
  triggered.push({ type: "otp", title: "5. OTP Notification", result: n5 });

  // 6. Successfully Received
  const n6 = await emailService.sendSuccessfullyReceivedNotification(userObj, sampleBook, sampleRental);
  triggered.push({ type: "successfully_received", title: "6. Successfully Received", result: n6 });

  // 7. Penalty / Overdue
  const n7 = await emailService.sendPenaltyNotification(userObj, sampleBook, sampleRental, {
    daysOverdue: 4,
    finePerDay: 10,
    totalPenalty: 40
  });
  triggered.push({ type: "penalty", title: "7. Penalty / Overdue Notification", result: n7 });

  // 8. Overall Completed
  const n8 = await emailService.sendOverallCompletedNotification(userObj, sampleBook, sampleRental);
  triggered.push({ type: "completed", title: "8. Overall Completed", result: n8 });

  res.json({
    success: true,
    message: `All 8 lifecycle email notifications successfully triggered and saved for ${targetEmail}!`,
    recipient: targetEmail,
    count: triggered.length,
    data: triggered
  });
});

// @desc   Trigger single specific notification type
// @route  POST /api/notifications/trigger/:type
const triggerSingleNotification = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const targetEmail = (req.body.email || (req.user && req.user.email) || "").toLowerCase().trim();
  if (!targetEmail) {
    res.status(400);
    throw new Error("Recipient email address is required");
  }
  const userName = req.body.name || (req.user && req.user.name) || targetEmail.split("@")[0];
  const userObj = { _id: req.user ? req.user._id : null, name: userName, email: targetEmail };

  const book = req.body.book || {
    title: req.body.bookTitle || "Computer Networks (6th Edition)",
    author: req.body.author || "Andrew S. Tanenbaum",
    rentalPrice: 60,
    listingType: "rental"
  };

  const rental = req.body.rental || {
    _id: "rn-" + Date.now().toString(16),
    pickupOtp: Math.floor(100000 + Math.random() * 900000).toString(),
    dueDate: new Date(Date.now() + 14 * 86400000)
  };

  let result = null;

  switch (type) {
    case "sign_in":
      result = await emailService.sendSignInNotification(userObj, {
        time: new Date().toLocaleString(),
        device: "Chrome / Windows",
        ip: "127.0.0.1"
      });
      break;
    case "book_buying":
      result = await emailService.sendBookBuyingNotification(userObj, book, rental);
      break;
    case "pending":
      result = await emailService.sendPendingNotification(userObj, book, rental);
      break;
    case "accepted":
      result = await emailService.sendBookAcceptedNotification(userObj, book, rental);
      break;
    case "otp":
      result = await emailService.sendOtpNotification(userObj, rental.pickupOtp, "Counter Pickup Verification", { bookTitle: book.title });
      break;
    case "successfully_received":
      result = await emailService.sendSuccessfullyReceivedNotification(userObj, book, rental);
      break;
    case "penalty":
      result = await emailService.sendPenaltyNotification(userObj, book, rental, { daysOverdue: 3, finePerDay: 10, totalPenalty: 30 });
      break;
    case "completed":
      result = await emailService.sendOverallCompletedNotification(userObj, book, rental);
      break;
    default:
      res.status(400);
      throw new Error(`Unknown notification type '${type}'. Valid types: sign_in, book_buying, pending, accepted, otp, successfully_received, penalty, completed.`);
  }

  res.json({
    success: true,
    message: `Notification '${type}' successfully sent to ${targetEmail}`,
    data: result
  });
});

// @desc   Mark notification as read
// @route  PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  res.json({ success: true, data: notification });
});

// @desc   Clear notifications
// @route  DELETE /api/notifications
const clearNotifications = asyncHandler(async (req, res) => {
  const userEmail = req.user ? req.user.email : req.query.email;
  if (userEmail) {
    await Notification.deleteMany({ userEmail: userEmail.toLowerCase() });
  }
  emailService.recentNotifications.length = 0;
  res.json({ success: true, message: "Notifications cleared" });
});

module.exports = {
  getNotifications,
  testAllNotifications,
  triggerSingleNotification,
  markAsRead,
  clearNotifications
};
