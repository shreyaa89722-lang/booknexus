const asyncHandler = require("express-async-handler");
const Book = require("../models/book");
const User = require("../models/user");
const Rental = require("../models/rental");
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
  const [renterRentals, ownerRentals, userTransactions, totalBooksInCatalog, myListedBooks] = await Promise.all([
    Rental.find({ renter: userId })
      .populate("book", "title author coverUrl genre subject listingType rentalPricePerWeek")
      .populate("owner", "name email usn")
      .sort({ createdAt: -1 })
      .lean(),
    Rental.find({ owner: userId })
      .populate("book", "title author coverUrl genre subject listingType rentalPricePerWeek")
      .populate("renter", "name email usn")
      .sort({ createdAt: -1 })
      .lean(),
    Transaction.find({ user: userId })
      .populate("book", "title author")
      .sort({ createdAt: -1 })
      .lean(),
    Book.countDocuments(),
    Book.countDocuments({ owner: userId }),
  ]);

  // ---------------------------------------------------------------------
  // Per-rental money, derived from this user's own transaction records.
  // A rental's fee falls back to the book's listed weekly price only when no
  // transaction exists yet, so nothing here is invented.
  // ---------------------------------------------------------------------
  const sumTx = (rentalId, type, statuses) =>
    userTransactions
      .filter(
        (tx) =>
          tx.rental &&
          tx.rental.toString() === rentalId.toString() &&
          tx.type === type &&
          statuses.includes(tx.status)
      )
      .reduce((total, tx) => total + (tx.amount || 0), 0);

  const SETTLED = ["successful"];
  const SETTLED_OR_PENDING = ["successful", "pending", "initiated"];

  const moneyFor = (rental) => {
    const id = rental._id;
    const listPrice = (rental.book && rental.book.rentalPricePerWeek) || 0;
    const feePaid = sumTx(id, "rental_fee", SETTLED);
    const feeQuoted = sumTx(id, "rental_fee", SETTLED_OR_PENDING);
    const depositAmount = sumTx(id, "deposit_held", SETTLED);
    const depositReturned = sumTx(id, "deposit_refund", SETTLED);
    const finePaid = sumTx(id, "fine_payment", SETTLED);
    const penalty = rental.penaltyAmount || 0;
    const fineOutstanding = Math.max(0, penalty - finePaid);

    let depositState = "none";
    if (depositAmount > 0) {
      if (depositReturned >= depositAmount) depositState = "ret";
      else if (depositReturned > 0) depositState = "part";
      else if (rental.returnDate) depositState = "pend";
      else depositState = "held";
    }

    return {
      rentalFee: feeQuoted || listPrice,
      rentalFeePaid: feePaid,
      depositAmount,
      depositReturned,
      depositRetained: depositState === "part" ? depositAmount - depositReturned : 0,
      depositState,
      finePaid,
      fineOutstanding,
      paid: feePaid > 0,
    };
  };

  const GROUP_OF = {
    requested: "pending",
    pending: "pending",
    rejected: "cancelled",
    approved: "approved",
    active: "active",
    received: "active",
    overdue: "active",
    returned: "returned",
    completed: "completed",
  };

  const isLibraryRental = (r) =>
    !r.owner || (r.book && r.book.listingType === "library");

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
  // Outstanding fines: any penalty on a rental of this user that has not been
  // settled by a successful fine payment yet (not just the "overdue" status —
  // a book can be returned late and still owe a fine).
  let outstandingFines = 0;
  renterRentals.forEach((r) => {
    outstandingFines += moneyFor(r).fineOutstanding;
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

  // Earnings on books this user lent out and has already got back.
  // The Book model stores `rentalPricePerWeek` — there is no `price` field, so
  // the previous `r.book.price` lookup always produced 0.
  ownerRentals.forEach((r) => {
    if (["completed", "returned"].includes(r.status)) {
      rentalEarnings += moneyFor(r).rentalFee;
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
      amount: moneyFor(r).rentalFee,
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
      amount: moneyFor(r).rentalFee,
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

  // ---------------------------------------------------------------------
  // Normalised records the dashboard renders from. Dates stay ISO here; the
  // client turns them into its own relative offsets.
  // ---------------------------------------------------------------------
  const shortRef = (prefix, r) => prefix + "-" + r._id.toString().slice(-6).toUpperCase();

  const peerRentalRecord = (r, role) => {
    const m = moneyFor(r);
    // A late-return penalty is owed by the borrower, so it never appears on the
    // owner's copy of the same rental.
    const finePaid = role === "B" ? m.finePaid : 0;
    const fineOutstanding = role === "B" ? m.fineOutstanding : 0;
    const counterparty =
      role === "B"
        ? (r.owner && r.owner.name) || "Campus Library"
        : (r.renter && r.renter.name) || "Student";
    return {
      id: shortRef("RN", r),
      rentalId: r._id.toString(),
      role,
      title: (r.book && r.book.title) || "Book",
      author: (r.book && r.book.author) || "",
      dept: (r.book && (r.book.genre || r.book.subject)) || "",
      counterparty,
      status: r.status,
      group: GROUP_OF[r.status] || "active",
      requestDate: r.requestDate || r.createdAt,
      approvedDate: r.approvedDate,
      receivedDate: r.receivedDate,
      dueDate: r.dueDate,
      returnDate: r.returnDate,
      rentalFee: m.rentalFee,
      depositAmount: m.depositAmount,
      depositReturned: m.depositReturned,
      depositRetained: m.depositRetained,
      depositState: m.depositState,
      finePaid,
      fineOutstanding,
      paid: m.paid,
      pickedUp: Boolean(r.receivedDate) || ["active", "received", "overdue", "returned", "completed"].includes(r.status),
      earned: role === "L" && ["completed", "returned"].includes(r.status),
    };
  };

  const libraryRecord = (r) => {
    const m = moneyFor(r);
    return {
      id: shortRef("LB", r),
      rentalId: r._id.toString(),
      title: (r.book && r.book.title) || "Library Book",
      author: (r.book && r.book.author) || "",
      dept: (r.book && (r.book.genre || r.book.subject)) || "",
      status: r.status,
      group: GROUP_OF[r.status] || "active",
      borrowedDate: r.receivedDate || r.approvedDate || r.requestDate || r.createdAt,
      dueDate: r.dueDate,
      returnDate: r.returnDate,
      finePaid: m.finePaid,
      fineOutstanding: m.fineOutstanding,
    };
  };

  const libraryBorrowings = renterRentals.filter(isLibraryRental);
  const peerBorrowings = renterRentals.filter((r) => !isLibraryRental(r));

  const records = {
    rentals: [
      ...peerBorrowings.map((r) => peerRentalRecord(r, "B")),
      ...ownerRentals.map((r) => peerRentalRecord(r, "L")),
    ],
    library: libraryBorrowings.map(libraryRecord),
  };

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
        rentalPayments,
        otherSpent,
        libraryBorrowed: libraryBorrowings.filter((r) => !r.returnDate && ["active", "received", "overdue"].includes(r.status)).length,
        peerBorrowed: peerBorrowings.filter((r) => !r.returnDate && ["active", "received", "overdue"].includes(r.status)).length,
        overdueCount: renterRentals.filter((r) => r.status === "overdue" || (r.dueDate && !r.returnDate && new Date(r.dueDate) < new Date() && ["active", "received", "approved"].includes(r.status))).length,
        totalBooks: totalBooksInCatalog,
        myListedBooks,
      },
      records,
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
