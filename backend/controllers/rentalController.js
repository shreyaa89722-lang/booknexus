const asyncHandler = require("express-async-handler");
const Rental = require("../models/Rental");
const Book = require("../models/Book");

const DEFAULT_LOAN_DAYS = 14;

// @desc   Request to rent a book
// @route  POST /api/rentals
const requestRental = asyncHandler(async (req, res) => {
    const { bookId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
        res.status(404);
        throw new Error("Book not found");
    }
    if (book.availability !== "available") {
        res.status(400);
        throw new Error("This book is not currently available");
    }
    if (book.owner && book.owner.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You cannot rent your own listed book");
    }

    const rental = await Rental.create({
        book: book._id,
        renter: req.user._id,
        owner: book.owner,
    });

    res.status(201).json({ success: true, data: rental });
});

// @desc   Approve a rental request
// @route  PUT /api/rentals/:id/approve
const approveRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id).populate("book");
    if (!rental) {
        res.status(404);
        throw new Error("Rental request not found");
    }

    const isListingOwner = rental.owner && rental.owner.toString() === req.user._id.toString();
    if (!isListingOwner && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to approve this rental");
    }
    if (rental.status !== "requested") {
        res.status(400);
        throw new Error(`Cannot approve a rental in '${rental.status}' status`);
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + DEFAULT_LOAN_DAYS * 24 * 60 * 60 * 1000);

    rental.status = "active";
    rental.approvedDate = now;
    rental.dueDate = dueDate;
    await rental.save();

    await Book.findByIdAndUpdate(rental.book._id, { availability: "rented" });

    res.json({ success: true, data: rental });
});

// @desc   Reject a rental request
// @route  PUT /api/rentals/:id/reject
const rejectRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
        res.status(404);
        throw new Error("Rental request not found");
    }

    const isListingOwner = rental.owner && rental.owner.toString() === req.user._id.toString();
    if (!isListingOwner && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to reject this rental");
    }
    if (rental.status !== "requested") {
        res.status(400);
        throw new Error(`Cannot reject a rental in '${rental.status}' status`);
    }

    rental.status = "rejected";
    await rental.save();

    res.json({ success: true, data: rental });
});

// @desc   Mark a rental as returned
// @route  PUT /api/rentals/:id/return
const returnRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
        res.status(404);
        throw new Error("Rental request not found");
    }

    const isRenter = rental.renter.toString() === req.user._id.toString();
    const isListingOwner = rental.owner && rental.owner.toString() === req.user._id.toString();
    if (!isRenter && !isListingOwner && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to return this rental");
    }
    if (!["active", "overdue"].includes(rental.status)) {
        res.status(400);
        throw new Error(`Cannot return a rental in '${rental.status}' status`);
    }

    rental.status = "returned";
    rental.returnDate = new Date();
    await rental.save();

    await Book.findByIdAndUpdate(rental.book, { availability: "available" });

    res.json({ success: true, data: rental });
});

// @desc   Get rentals (scoped to the logged-in user's role)
// @route  GET /api/rentals
const getRentals = asyncHandler(async (req, res) => {
    let filter = {};
    if (req.user.role === "student") {
        filter = { renter: req.user._id };
    } else if (req.user.role === "owner") {
        filter = { $or: [{ owner: req.user._id }, { renter: req.user._id }] };
    }

    const rentals = await Rental.find(filter)
        .populate("book", "title author coverUrl")
        .populate("renter", "name email")
        .populate("owner", "name email")
        .sort({ createdAt: -1 });

    res.json({ success: true, data: rentals });
});

module.exports = { requestRental, approveRental, rejectRental, returnRental, getRentals };
