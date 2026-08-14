const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        author: { type: String, required: true, trim: true },
        genre: { type: String, required: true, trim: true },
        subject: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        coverUrl: { type: String, default: "" },
        condition: {
            type: String,
            enum: ["new", "good", "fair", "worn"],
            default: "good",
        },
        listingType: {
            type: String,
            enum: ["library", "p2p"],
            default: "library",
        },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        availability: {
            type: String,
            enum: ["available", "rented", "unavailable"],
            default: "available",
        },
        rentalPricePerWeek: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Enables text search across these fields (used later for book search)
bookSchema.index({ title: "text", author: "text", genre: "text", subject: "text" });

module.exports = mongoose.model("Book", bookSchema);
