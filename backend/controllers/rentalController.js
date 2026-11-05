const asyncHandler = require("express-async-handler");
const Rental = require("../models/Rental");
const Book = require("../models/Book");
const User = require("../models/User");
const { recordRentalOnChain, recordReturnOnChain } = require("../services/blockchainService");
const emailService = require("../services/emailService");
const emailEventService = require("../services/emailEventService");

const DEFAULT_LOAN_DAYS = 14;

// @desc   Request to rent or buy a book (Order creation)
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

    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const rental = await Rental.create({
        book: book._id,
        renter: req.user._id,
        owner: book.owner,
        pickupOtp: pickupOtp,
        status: "pending",
        requestDate: new Date(),
    });

    // Send Borrow Submitted Notification via emailEventService
    try {
        emailEventService.onBorrowSubmitted(rental, req.user, book)
            .catch(e => console.warn("Borrow submitted event note:", e.message));
    } catch (e) {}

    // Legacy fallback dispatch
    try {
        emailService.sendBookBuyingNotification(req.user, book, rental)
            .catch(e => console.warn("Book buying notification warning:", e.message));
    } catch (e) {}

    res.status(201).json({ success: true, data: rental });
});

// @desc   Approve / Accept a rental request
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
    if (rental.status !== "requested" && rental.status !== "pending") {
        res.status(400);
        throw new Error(`Cannot approve a rental in '${rental.status}' status`);
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + DEFAULT_LOAN_DAYS * 24 * 60 * 60 * 1000);

    if (!rental.pickupOtp) {
        rental.pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
    }
    rental.status = "approved";
    rental.approvedDate = now;
    rental.dueDate = dueDate;
    await rental.save();

    try {
        const dueDateUnix = Math.floor(rental.dueDate.getTime() / 1000);
        const onChainResult = await recordRentalOnChain(rental.book._id.toString(), req.user.walletAddress, dueDateUnix);
        if (onChainResult) {
            if (onChainResult.txHash) rental.contractTxHash = onChainResult.txHash;
            if (onChainResult.onChainRentalId !== null && onChainResult.onChainRentalId !== undefined) {
                rental.onChainRentalId = onChainResult.onChainRentalId;
            }
            await rental.save();
        }
    } catch (err) {
        console.error("Blockchain recording failed (non-fatal):", err.message);
    }

    await Book.findByIdAndUpdate(rental.book._id, { availability: "rented" });

    // Send Borrow Approved Notification via emailEventService and legacy emailService
    try {
        const renterUser = await User.findById(rental.renter);
        if (renterUser) {
            emailEventService.onBorrowApproved(rental, renterUser, rental.book)
                .catch(e => console.warn("Borrow approved event error:", e.message));
            emailService.sendBookAcceptedNotification(renterUser, rental.book, rental)
                .catch(e => console.warn("Accepted notification warning:", e.message));
            emailService.sendOtpNotification(renterUser, rental.pickupOtp, "Counter Pickup Verification", { bookTitle: rental.book.title, expiryMinutes: 15 })
                .catch(e => console.warn("OTP notification warning:", e.message));
        }
    } catch (e) {}

    res.json({ success: true, data: rental });
});

// @desc   Confirm book handover / Successfully Received
// @route  PUT /api/rentals/:id/receive
const receiveRental = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const rental = await Rental.findById(req.params.id).populate("book");
    if (!rental) {
        res.status(404);
        throw new Error("Rental request not found");
    }

    // Verify OTP if provided
    if (otp && rental.pickupOtp && otp.trim() !== rental.pickupOtp.trim()) {
        res.status(400);
        throw new Error("Invalid pickup OTP code");
    }

    rental.status = "received";
    rental.receivedDate = new Date();
    await rental.save();

    // Send Rental Started Event via emailEventService & legacy service
    try {
        const renterUser = await User.findById(rental.renter);
        if (renterUser) {
            emailEventService.onRentalStarted(rental, renterUser, rental.book)
                .catch(e => console.warn("Rental started event error:", e.message));
            emailService.sendSuccessfullyReceivedNotification(renterUser, rental.book, rental)
                .catch(e => console.warn("Successfully received notification warning:", e.message));
        }
    } catch (e) {}

    res.json({ success: true, message: "Handover confirmed and book successfully received!", data: rental });
});

// @desc   Assess late penalty / overdue notice
// @route  POST /api/rentals/:id/penalty
const penaltyRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id).populate("book");
    if (!rental) {
        res.status(404);
        throw new Error("Rental request not found");
    }

    const finePerDay = req.body.finePerDay || 10;
    const daysOverdue = req.body.daysOverdue || 3;
    const totalPenalty = finePerDay * daysOverdue;

    rental.status = "overdue";
    rental.penaltyAmount = totalPenalty;
    await rental.save();

    // Send Overdue Notice via emailEventService & legacy service
    try {
        const renterUser = await User.findById(rental.renter);
        if (renterUser) {
            emailEventService.onOverdueNotice(rental, renterUser, rental.book, {
                daysOverdue,
                finePerDay,
                totalPenalty,
            }).catch(e => console.warn("Overdue notice event error:", e.message));
            emailService.sendPenaltyNotification(renterUser, rental.book, rental, {
                daysOverdue,
                finePerDay,
                totalPenalty,
            }).catch(e => console.warn("Penalty notification warning:", e.message));
        }
    } catch (e) {}

    res.json({ success: true, message: "Overdue penalty assessed and notification dispatched", data: rental });
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
    if (rental.status !== "requested" && rental.status !== "pending") {
        res.status(400);
        throw new Error(`Cannot reject a rental in '${rental.status}' status`);
    }

    rental.status = "rejected";
    await rental.save();

    // Send Borrow Rejected notification
    try {
        const renterUser = await User.findById(rental.renter);
        const book = await Book.findById(rental.book);
        if (renterUser) {
            emailEventService.onBorrowRejected(rental, renterUser, book, req.body.reason)
                .catch(e => console.warn("Borrow rejected event error:", e.message));
        }
    } catch (e) {}

    res.json({ success: true, data: rental });
});

// @desc   Mark a rental as returned / Overall Completed
// @route  PUT /api/rentals/:id/return
const returnRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id).populate("book");
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

    rental.status = "completed";
    rental.returnDate = new Date();
    await rental.save();

    try {
        if (rental.onChainRentalId !== null && rental.onChainRentalId !== undefined) {
            const retTx = await recordReturnOnChain(rental.onChainRentalId);
            if (retTx) {
                rental.returnTxHash = retTx;
                await rental.save();
            }
        }
    } catch (err) {
        console.error("Blockchain return recording failed (non-fatal):", err.message);
    }

    await Book.findByIdAndUpdate(rental.book, { availability: "available" });

    // Send Return Confirmed & Rental Completed Notifications
    try {
        const renterUser = await User.findById(rental.renter);
        if (renterUser) {
            emailEventService.onReturnConfirmed(rental, renterUser, rental.book)
                .catch(e => console.warn("Return confirmed event error:", e.message));
            emailEventService.onRentalCompleted(rental, renterUser, rental.book, {
                txHash: rental.returnTxHash,
            }).catch(e => console.warn("Rental completed event error:", e.message));
            emailService.sendOverallCompletedNotification(renterUser, rental.book, rental)
                .catch(e => console.warn("Overall completed notification warning:", e.message));
        }
    } catch (e) {}

    res.json({ success: true, message: "Rental returned and cycle overall completed!", data: rental });
});

// @desc   Get rentals (scoped to the logged-in user's role)
// @route  GET /api/rentals
const getRentals = asyncHandler(async (req, res) => {
    let filter = {};
    if (req.user && (req.user.role === "admin" || req.user.role === "librarian")) {
        filter = {};
    } else if (req.user) {
        filter = { $or: [{ renter: req.user._id }, { owner: req.user._id }] };
    } else {
        return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const rentals = await Rental.find(filter)
        .populate("book", "title author coverUrl genre subject listingType")
        .populate("renter", "name email")
        .populate("owner", "name email")
        .sort({ createdAt: -1 });

    res.json({ success: true, data: rentals });
});

module.exports = {
    requestRental,
    approveRental,
    receiveRental,
    penaltyRental,
    rejectRental,
    returnRental,
    getRentals,
};
