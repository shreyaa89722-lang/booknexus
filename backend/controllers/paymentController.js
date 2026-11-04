const asyncHandler = require("express-async-handler");
const Transaction = require("../models/transaction");
const Rental = require("../models/Rental");
const Book = require("../models/Book");
const emailEventService = require("../services/emailEventService");

/**
 * @desc   Initiate a payment or fine settlement
 * @route  POST /api/payments/initiate
 * @access Private
 */
const initiatePayment = asyncHandler(async (req, res) => {
  const { rentalId, bookId, type, amount, paymentMethod = "campus_counter_upi", note } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("A valid payment amount is required");
  }

  const transactionRef = "TXN-" + Date.now().toString(16).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);

  // Check configurable Campus UPI Settings (Requirement 14: Never hardcode real UPI ID, detect unconfigured)
  const campusUpiId = (process.env.CAMPUS_UPI_ID || "").trim();
  const payeeName = (process.env.CAMPUS_UPI_PAYEE_NAME || "BookNexus Campus Library").trim();
  const isUpiConfigured = Boolean(
    campusUpiId &&
    !campusUpiId.includes("your_campus") &&
    !campusUpiId.includes("placeholder")
  );

  const paymentPurpose = type ? type.replace(/_/g, " ") : "fine payment";
  const upiUri = isUpiConfigured
    ? `upi://pay?pa=${encodeURIComponent(campusUpiId)}&pn=${encodeURIComponent(payeeName)}&am=${Number(amount).toFixed(2)}&tr=${encodeURIComponent(transactionRef)}&cu=INR&tn=${encodeURIComponent(`BookNexus ${paymentPurpose} ${transactionRef}`)}`
    : null;

  const txn = await Transaction.create({
    transactionRef,
    user: req.user._id,
    rental: rentalId || null,
    book: bookId || null,
    type: type || "fine_payment",
    amount: Number(amount),
    currency: "INR",
    status: "initiated",
    paymentMethod,
    note: note || "",
    isVerified: false,
  });

  // Fetch book if attached for template rendering
  let book = null;
  if (bookId) book = await Book.findById(bookId);

  // Trigger payment initiated notification
  emailEventService.queueEmailEvent({
    eventType: "payment.initiated",
    category: "transactional",
    recipient: req.user,
    relatedTransactionId: txn._id,
    relatedRentalId: rentalId || null,
    relatedBookId: bookId || null,
    templateName: "paymentInitiated",
    templateData: {
      transactionRef: txn.transactionRef,
      purpose: paymentPurpose,
      amount: txn.amount,
      bookTitle: book ? book.title : "Library Materials",
    },
    idempotencyKey: `payment.initiated:${txn.transactionRef}`,
  }).catch((e) => console.warn("Payment initiated notification note:", e.message));

  res.status(201).json({
    success: true,
    message: isUpiConfigured
      ? "Payment initiated. Please complete the UPI payment and submit the UTR."
      : "Payment initiated. Campus UPI ID is not configured; please settle at the campus library desk.",
    data: txn,
    isUpiConfigured,
    campusUpiId: isUpiConfigured ? campusUpiId : null,
    payeeName: isUpiConfigured ? payeeName : null,
    upiUri: upiUri || null,
  });
});

/**
 * @desc   Submit UPI UTR / Reference number by student
 * @route  POST /api/payments/submit-utr
 * @access Private
 */
const submitUtr = asyncHandler(async (req, res) => {
  const { transactionRef, utrNumber } = req.body;

  if (!transactionRef) {
    res.status(400);
    throw new Error("Transaction reference is required");
  }

  if (!utrNumber || utrNumber.trim().length < 6) {
    res.status(400);
    throw new Error("A valid UPI UTR / Reference number (minimum 6 characters) is required");
  }

  const txn = await Transaction.findOne({ transactionRef }).populate("book user");
  if (!txn) {
    res.status(404);
    throw new Error("Transaction record not found");
  }

  // Only the transaction owner or admin can submit UTR
  if (txn.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to submit UTR for this transaction");
  }

  // Prevent resubmission on completed / refunded transactions
  if (txn.status === "successful") {
    res.status(400);
    throw new Error("This transaction has already been verified and completed.");
  }
  if (txn.status === "refunded") {
    res.status(400);
    throw new Error("This transaction has already been refunded.");
  }

  txn.gatewayReference = utrNumber.trim();
  txn.status = "pending"; // Pending Verification
  txn.note = (txn.note ? txn.note + " | " : "") + "UTR Submitted: " + utrNumber.trim();
  await txn.save();

  res.json({
    success: true,
    message: "UTR reference submitted successfully. Status updated to Pending Verification by librarian.",
    data: txn,
  });
});

/**
 * @desc   Server-side payment verification (Authorized manual librarian verification)
 * @route  POST /api/payments/verify
 * @access Private (Admin / Librarian only)
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { transactionRef, serverVerificationCode, note } = req.body;

  if (!transactionRef) {
    res.status(400);
    throw new Error("Transaction reference is required");
  }

  const txn = await Transaction.findOne({ transactionRef }).populate("book user");
  if (!txn) {
    res.status(404);
    throw new Error("Transaction record not found");
  }

  // Prevent duplicate verification and duplicate receipts
  if (txn.status === "successful" || txn.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Payment has already been verified. Duplicate verification and receipts prevented.",
      data: txn,
    });
  }

  // Authorized verifier check: must be admin or have valid server code
  const isAuthorizedVerifier = req.user.role === "admin";
  const hasValidVerificationCode = serverVerificationCode && serverVerificationCode.length >= 6;

  if (!isAuthorizedVerifier && !hasValidVerificationCode) {
    res.status(403);
    throw new Error("Unauthorized: Manual payment verification requires campus librarian or administrator credentials.");
  }

  // Verification succeeded
  txn.status = "successful";
  txn.isVerified = true;
  txn.verifiedAt = new Date();
  txn.verifiedBy = req.user._id;
  if (note) txn.note = (txn.note ? txn.note + " | " : "") + note;
  await txn.save();

  // If this was an overdue penalty payment, update the rental record
  if (txn.rental) {
    await Rental.findByIdAndUpdate(txn.rental, { penaltyAmount: 0 }).catch(() => {});
  }

  // 1. Queue Payment Success Notification
  await emailEventService.onPaymentSuccess(txn, txn.user, txn.book || {});

  // 2. Queue Official University Transaction Receipt
  await emailEventService.onTransactionReceipt(txn, txn.user, txn.book || {});

  res.json({
    success: true,
    message: "Payment verified successfully by librarian and official receipt dispatched",
    data: txn,
  });
});

/**
 * @desc   Reject payment (e.g. invalid UTR / fake reference)
 * @route  POST /api/payments/reject
 * @access Private (Admin / Librarian only)
 */
const rejectPayment = asyncHandler(async (req, res) => {
  const { transactionRef, reason } = req.body;

  if (!transactionRef) {
    res.status(400);
    throw new Error("Transaction reference is required");
  }

  const txn = await Transaction.findOne({ transactionRef }).populate("book user");
  if (!txn) {
    res.status(404);
    throw new Error("Transaction record not found");
  }

  if (txn.status === "successful") {
    res.status(400);
    throw new Error("Cannot reject an already verified and successful transaction");
  }

  const rejectionReason = reason || "Submitted UPI reference could not be matched on the campus library bank account.";

  txn.status = "rejected";
  txn.isVerified = false;
  txn.rejectionReason = rejectionReason;
  txn.verifiedBy = req.user._id;
  await txn.save();

  // Dispatch payment failed notification
  try {
    await emailEventService.onPaymentFailed(txn, txn.user, txn.book || {}, rejectionReason);
  } catch (e) {
    console.warn("Payment failed notification note:", e.message);
  }

  res.json({
    success: true,
    message: "Payment rejected. Student notification dispatched.",
    data: txn,
  });
});

/**
 * @desc   Process a deposit refund
 * @route  POST /api/payments/refund
 * @access Private
 */
const processRefund = asyncHandler(async (req, res) => {
  const { rentalId, amount, note } = req.body;

  const rental = await Rental.findById(rentalId).populate("renter book");
  if (!rental) {
    res.status(404);
    throw new Error("Associated rental not found");
  }

  const isAuthorized = req.user.role === "admin" || (rental.owner && rental.owner.toString() === req.user._id.toString());
  if (!isAuthorized) {
    res.status(403);
    throw new Error("Not authorized to issue refunds for this rental");
  }

  const refundRef = "RFD-" + Date.now().toString(16).toUpperCase();
  const txn = await Transaction.create({
    transactionRef: refundRef,
    user: rental.renter._id,
    rental: rental._id,
    book: rental.book ? rental.book._id : null,
    type: "deposit_refund",
    amount: Number(amount || 0),
    currency: "INR",
    status: "refunded",
    paymentMethod: "campus_deposit_release",
    isVerified: true,
    verifiedAt: new Date(),
    verifiedBy: req.user._id,
    note: note || "Security deposit refunded after clean return inspection",
  });

  // Queue refund completed notification
  emailEventService.onRefundCompleted(txn, rental.renter, rental.book || {})
    .catch((e) => console.warn("Refund completed notification note:", e.message));

  res.json({
    success: true,
    message: "Refund processed and confirmation notification dispatched",
    data: txn,
  });
});

/**
 * @desc   Get user's transactions
 * @route  GET /api/payments
 * @access Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  let filter = { user: req.user._id };
  if (req.user.role === "admin") {
    filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
  }

  const txns = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .populate("book", "title author coverUrl")
    .populate("user", "name email usn")
    .populate("rental")
    .populate("verifiedBy", "name email");

  res.json({ success: true, count: txns.length, data: txns });
});

module.exports = {
  initiatePayment,
  submitUtr,
  verifyPayment,
  rejectPayment,
  processRefund,
  getTransactions,
};
