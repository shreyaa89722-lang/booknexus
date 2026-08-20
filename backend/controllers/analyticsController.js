const asyncHandler = require("express-async-handler");
const Book = require("../models/Book");
const User = require("../models/User");
const Rental = require("../models/Rental");

// @desc   Get system-wide usage analytics
// @route  GET /api/analytics/overview
const getOverview = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalBooks,
    totalUsers,
    rentalsByStatus,
    mostRentedBooks,
    genreDistribution,
    overdueRentals,
    rentalTrends,
    activeUsers30d,
    userGrowth,
  ] = await Promise.all([
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

    // Overdue rentals count & list
    Rental.find({
      $or: [
        { status: "overdue" },
        { status: { $in: ["active", "approved"] }, dueDate: { $lt: new Date() } }
      ]
    })
      .populate("book", "title author")
      .populate("renter", "name email")
      .lean(),

    // Rental trends over time (per day over last 30 days)
    Rental.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Active users (distinct renters in last 30 days)
    Rental.distinct("renter", { createdAt: { $gte: thirtyDaysAgo } }),

    // User growth (new registrations per day over last 30 days)
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalBooks,
      totalUsers,
      rentalsByStatus,
      mostRentedBooks,
      genreDistribution,
      overdueRentalsCount: overdueRentals.length,
      overdueRentals,
      rentalTrends,
      activeUsersCount: activeUsers30d.length,
      userGrowth,
    },
  });
});

module.exports = { getOverview };
