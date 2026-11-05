const asyncHandler = require("express-async-handler");
const Book = require("../models/Book");
const User = require("../models/User");
const Rental = require("../models/Rental");
const Transaction = require("../models/transaction");

// @desc   Get system-wide usage analytics (Admin only)
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

// @desc   Get authenticated student's personalized activity and dashboard metrics
// @route  GET /api/analytics/user-dashboard
const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Query rentals where authenticated user is the renter or owner
  const [renterRentals, ownerRentals, userTransactions] = await Promise.all([
    Rental.find({ renter: userId })
      .populate("book", "title author coverImage genre price")
      .populate("owner", "name email usn")
      .sort({ createdAt: -1 })
      .lean(),
    Rental.find({ owner: userId })
      .populate("book", "title author coverImage genre price")
      .populate("renter", "name email usn")
      .sort({ createdAt: -1 })
      .lean(),
    Transaction.find({ user: userId })
      .populate("book", "title author")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // Activity counts
  const borrowedRentals = renterRentals.filter((r) =>
    ["active", "received", "overdue"].includes(r.status) && !r.returnDate
  );
  const lentRentals = ownerRentals.filter((r) =>
    ["active", "received", "overdue"].includes(r.status) && !r.returnDate
  );
  const pendingRequests = renterRentals.filter((r) =>
    ["requested", "pending"].includes(r.status)
  );
  const activeRentals = renterRentals.filter((r) =>
    ["active", "received", "approved", "overdue"].includes(r.status)
  );
  const completedRentals = renterRentals.filter((r) =>
    ["completed", "returned"].includes(r.status)
  );
  const returnedBooks = renterRentals.filter(
    (r) => r.returnDate != null || ["returned", "completed"].includes(r.status)
  );

  // Financial calculations
  // Outstanding library fines: sum of penaltyAmount on overdue/active rentals
  let outstandingFines = 0;
  renterRentals.forEach((r) => {
    if (r.penaltyAmount && r.penaltyAmount > 0 && r.status === "overdue") {
      outstandingFines += r.penaltyAmount;
    }
  });

  // Successful transactions breakdown
  let finesPaid = 0;
  let rentalPayments = 0;
  let otherSpent = 0;
  let depositsHeld = 0;
  let depositsReturned = 0;
  let rentalEarnings = 0;

  userTransactions.forEach((tx) => {
    if (tx.status === "successful") {
      if (tx.type === "fine_payment") {
        finesPaid += tx.amount || 0;
      } else if (tx.type === "rental_fee") {
        rentalPayments += tx.amount || 0;
      } else if (["platform_fee", "purchase"].includes(tx.type)) {
        otherSpent += tx.amount || 0;
      } else if (tx.type === "deposit_held") {
        depositsHeld += tx.amount || 0;
      } else if (tx.type === "deposit_refund") {
        depositsReturned += tx.amount || 0;
      }
    }
  });

  // Adjust net active deposits held (cannot be negative)
  const netDepositsHeld = Math.max(0, depositsHeld - depositsReturned);

  // Completed owner rentals earnings
  ownerRentals.forEach((r) => {
    if (r.status === "completed" && r.book && r.book.price) {
      rentalEarnings += r.book.price;
    }
  });

  // Real money spent = rental fees + fines paid + platform fees (refundable deposits are excluded)
  const totalSpent = rentalPayments + finesPaid + otherSpent;

  // Determine if user has any real activity
  const hasActivity =
    renterRentals.length > 0 ||
    ownerRentals.length > 0 ||
    userTransactions.length > 0;

  // Format activity events for the timeline
  const recentActivity = [];

  renterRentals.forEach((r) => {
    recentActivity.push({
      id: r._id.toString(),
      type: "rental_borrow",
      role: "B",
      title: r.book?.title || "Book Rental",
      author: r.book?.author || "",
      status: r.status,
      date: r.createdAt,
      amount: r.book?.price || 0,
      ref: "RN-" + r._id.toString().slice(-4).toUpperCase(),
    });
  });

  ownerRentals.forEach((r) => {
    recentActivity.push({
      id: r._id.toString(),
      type: "rental_lend",
      role: "L",
      title: r.book?.title || "Book Lent",
      author: r.book?.author || "",
      status: r.status,
      date: r.createdAt,
      amount: r.book?.price || 0,
      ref: "RN-" + r._id.toString().slice(-4).toUpperCase(),
    });
  });

  userTransactions.forEach((tx) => {
    recentActivity.push({
      id: tx._id.toString(),
      type: "transaction",
      title: tx.book?.title || tx.type.replace(/_/g, " "),
      status: tx.status,
      date: tx.createdAt,
      amount: tx.amount,
      ref: tx.transactionRef,
      direction: ["deposit_refund"].includes(tx.type) ? "in" : "out",
    });
  });

  recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    success: true,
    data: {
      userId: userId.toString(),
      hasActivity,
      emptyMessage: hasActivity
        ? null
        : "You haven't borrowed or rented any books yet. Explore the catalog to get started.",
      summary: {
        borrowedCount: borrowedRentals.length,
        lentCount: lentRentals.length,
        pendingRequests: pendingRequests.length,
        activeRentals: activeRentals.length,
        completedRentals: completedRentals.length,
        returnedBooks: returnedBooks.length,
        outstandingFines,
        finesPaid,
        totalSpent,
        depositsHeld: netDepositsHeld,
        depositsReturned,
        rentalEarnings,
      },
      rentals: {
        borrowed: renterRentals,
        lent: ownerRentals,
      },
      transactions: userTransactions,
      recentActivity: recentActivity.slice(0, 15),
    },
  });
});

module.exports = { getOverview, getUserDashboard };
