const asyncHandler = require("express-async-handler");
const Book = require("../models/Book");
const User = require("../models/User");
const Rental = require("../models/Rental");

// @desc   Get system-wide usage analytics
// @route  GET /api/analytics/overview
const getOverview = asyncHandler(async (req, res) => {
  const [totalBooks, totalUsers, rentalsByStatus, mostRentedBooks, genreDistribution] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments(),
    Rental.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Rental.aggregate([
      { $group: { _id: "$book", rentalCount: { $sum: 1 } } },
      { $sort: { rentalCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
      { $unwind: "$book" },
      { $project: { rentalCount: 1, "book.title": 1, "book.author": 1 } },
    ]),
    Book.aggregate([{ $group: { _id: "$genre", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
  ]);

  res.json({
    success: true,
    data: {
      totalBooks,
      totalUsers,
      rentalsByStatus,
      mostRentedBooks,
      genreDistribution,
    },
  });
});

module.exports = { getOverview };
