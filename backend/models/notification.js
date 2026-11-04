const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        userEmail: { type: String, required: true, lowercase: true, trim: true },
        type: {
            type: String,
            enum: [
                "sign_in",
                "book_buying",
                "pending",
                "accepted",
                "otp",
                "successfully_received",
                "penalty",
                "completed",
                "welcome",
                "general"
            ],
            required: true
        },
        title: { type: String, required: true },
        subject: { type: String, required: true },
        preview: { type: String, default: "" },
        html: { type: String, required: true },
        meta: { type: Object, default: {} },
        isRead: { type: Boolean, default: false },
        deliveryStatus: { type: String, enum: ["sent", "simulated", "failed"], default: "sent" },
        messageId: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
