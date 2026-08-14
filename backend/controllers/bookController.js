const asyncHandler = require("express-async-handler");
const Book = require("../models/Book");

// @desc   Create a book (library stock or a P2P listing)
// @route  POST /api/books
const createBook = asyncHandler(async (req, res) => {
    const { title, author, genre, subject, description, coverUrl, condition, listingType, rentalPricePerWeek } = req.body;

    if (!title || !author || !genre || !subject) {
        res.status(400);
        throw new Error("title, author, genre and subject are required");
    }

    const isP2P = listingType === "p2p";

    const book = await Book.create({
        title,
        author,
        genre,
        subject,
        description,
        coverUrl,
        condition,
        listingType: isP2P ? "p2p" : "library",
        owner: isP2P ? req.user._id : null,
        rentalPricePerWeek: isP2P ? rentalPricePerWeek || 0 : 0,
    });

    res.status(201).json({ success: true, data: book });
});

// @desc   Get all books (supports search + filters)
// @route  GET /api/books
const getBooks = asyncHandler(async (req, res) => {
    const { q, genre, listingType, availability, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (genre) filter.genre = genre;
    if (listingType) filter.listingType = listingType;
    if (availability) filter.availability = availability;
    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
        Book.find(filter).populate("owner", "name email").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        Book.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: books,
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
});

// @desc   Get a single book by id
// @route  GET /api/books/:id
const getBookById = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).populate("owner", "name email");
    if (!book) {
        res.status(404);
        throw new Error("Book not found");
    }
    res.json({ success: true, data: book });
});

// @desc   Update a book
// @route  PUT /api/books/:id
const updateBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        res.status(404);
        throw new Error("Book not found");
    }

    const isOwner = book.owner && book.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to update this book");
    }

    Object.assign(book, req.body);
    await book.save();

    res.json({ success: true, data: book });
});

// @desc   Delete a book
// @route  DELETE /api/books/:id
const deleteBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        res.status(404);
        throw new Error("Book not found");
    }

    const isOwner = book.owner && book.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to delete this book");
    }

    await book.deleteOne();
    res.json({ success: true, message: "Book deleted" });
});

module.exports = { createBook, getBooks, getBookById, updateBook, deleteBook };
