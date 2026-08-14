const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
    {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
        renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

        status: {
            type: String,
            enum: ["requested", "approved", "rejected", "active", "returned", "overdue"],
            default: "requested",
        },

        requestDate: { type: Date, default: Date.now },
        approvedDate: { type: Date, default: null },
        dueDate: { type: Date, default: null },
        returnDate: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Rental", rentalSchema);
