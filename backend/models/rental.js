const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
    {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
        renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

        status: {
            type: String,
            enum: ["requested", "pending", "approved", "active", "received", "returned", "completed", "rejected", "overdue"],
            default: "requested",
        },

        pickupOtp: { type: String, default: null },
        penaltyAmount: { type: Number, default: 0 },
        receivedDate: { type: Date, default: null },
        requestDate: { type: Date, default: Date.now },
        approvedDate: { type: Date, default: null },
        dueDate: { type: Date, default: null },
        returnDate: { type: Date, default: null },
        contractTxHash: { type: String, default: null },
        returnTxHash: { type: String, default: null },
        onChainRentalId: { type: Number, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Rental", rentalSchema);
