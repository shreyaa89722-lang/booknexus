const mongoose = require("mongoose");

const emailOutboxSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "security",
        "transactional",
        "rentals",
        "due_reminders",
        "announcements",
        "reading",
        "promotional",
      ],
      default: "transactional",
      index: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    recipientEmailSnapshot: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    recipientNameSnapshot: {
      type: String,
      default: "",
    },
    relatedRentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
      index: true,
    },
    relatedBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
    },
    relatedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
    },
    templateData: {
      type: Object,
      default: {},
    },
    renderedSubject: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "sent",
        "delivered",
        "failed",
        "bounced",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    provider: {
      type: String,
      default: "resend",
    },
    providerMessageId: {
      type: String,
      default: null,
      index: true,
    },
    lastError: {
      type: String,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    deliveryEvents: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: Object, default: {} },
      },
    ],
  },
  { timestamps: true }
);

// Compound index for background worker polling
emailOutboxSchema.index({ status: 1, scheduledAt: 1, attemptCount: 1 });

module.exports = mongoose.models.EmailOutbox || mongoose.model("EmailOutbox", emailOutboxSchema);
