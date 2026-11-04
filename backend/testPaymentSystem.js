const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Book = require("./models/Book");
const Rental = require("./models/Rental");
const Transaction = require("./models/transaction");
const {
  initiatePayment,
  submitUtr,
  verifyPayment,
  rejectPayment,
  processRefund,
  getTransactions,
} = require("./controllers/paymentController");

// Mock Express response helper
const createMockRes = () => {
  return {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
};

async function runPaymentSystemTests() {
  console.log("============================================================");
  console.log("  BOOKNEXUS CAMPUS UPI PAYMENT & TRANSACTION TEST SUITE    ");
  console.log("============================================================\n");

  const connectDB = require("./config/db");
  await connectDB();
  console.log("✓ Connected to MongoDB database:", mongoose.connection.name);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup Test Users and Book
    let student = await User.findOne({ email: "student.test.payment@univ.edu" });
    if (!student) {
      student = await User.create({
        name: "Test Payment Student",
        email: "student.test.payment@univ.edu",
        password: "Password123!",
        role: "student",
        usn: "CS2026-TEST",
      });
    }

    let librarian = await User.findOne({ email: "librarian.test.payment@univ.edu" });
    if (!librarian) {
      librarian = await User.create({
        name: "Campus Chief Librarian",
        email: "librarian.test.payment@univ.edu",
        password: "Password123!",
        role: "admin",
        usn: "STAFF-LIB-01",
      });
    }

    let book = await Book.findOne({ title: "Clean Code" });
    if (!book) {
      book = await Book.create({
        title: "Clean Code",
        author: "Robert C. Martin",
        genre: "Computer Science",
        subject: "Software Engineering",
        availability: "available",
      });
    }

    let rental = await Rental.create({
      book: book._id,
      renter: student._id,
      status: "overdue",
      penaltyAmount: 50,
      dueDate: new Date(Date.now() - 5 * 86400000),
    });

    console.log("\n--- TEST 1: State 'Initiated' & Dynamic UPI QR URL Generation ---");
    const reqInitiate = {
      user: student,
      body: {
        rentalId: rental._id,
        bookId: book._id,
        type: "fine_payment",
        amount: 50,
        note: "Overdue library fine for Clean Code",
      },
    };
    const resInitiate = createMockRes();
    await initiatePayment(reqInitiate, resInitiate);

    assert(resInitiate.statusCode === 201, "Initiate payment responds with HTTP 201");
    const txnInitiated = resInitiate.jsonData.data;
    assert(txnInitiated && txnInitiated.status === "initiated", "Transaction state is 'initiated'");
    assert(txnInitiated.isVerified === false, "Transaction isVerified is false");
    assert(txnInitiated.amount === 50, "Transaction amount is 50 INR");
    assert(resInitiate.jsonData.isUpiConfigured === true, "isUpiConfigured is true when CAMPUS_UPI_ID is set");
    assert(resInitiate.jsonData.upiUri && resInitiate.jsonData.upiUri.startsWith("upi://pay?"), "Dynamic UPI URI generated properly");

    console.log("\n--- TEST 2: State 'Pending' via Student UTR Submission ---");
    const reqSubmitUtr = {
      user: student,
      body: {
        transactionRef: txnInitiated.transactionRef,
        utrNumber: "UTR492819028471",
      },
    };
    const resSubmitUtr = createMockRes();
    await submitUtr(reqSubmitUtr, resSubmitUtr);

    assert(resSubmitUtr.statusCode === 200, "Submit UTR responds with HTTP 200");
    const txnPending = resSubmitUtr.jsonData.data;
    assert(txnPending.status === "pending", "Transaction state updated to 'pending' (Pending Verification)");
    assert(txnPending.gatewayReference === "UTR492819028471", "UTR reference saved accurately");
    assert(txnPending.isVerified === false, "isVerified remains false until manual librarian verification");

    console.log("\n--- TEST 3: State 'Successful' via Authorized Librarian Verification ---");
    const reqVerify = {
      user: librarian, // Role: admin
      body: {
        transactionRef: txnInitiated.transactionRef,
        note: "UTR checked against campus HDFC statement. Verified.",
      },
    };
    const resVerify = createMockRes();
    await verifyPayment(reqVerify, resVerify);

    assert(resVerify.statusCode === 200, "Librarian verification responds with HTTP 200");
    const txnSuccessful = resVerify.jsonData.data;
    assert(txnSuccessful.status === "successful", "Transaction state updated to 'successful'");
    assert(txnSuccessful.isVerified === true, "isVerified set to true");
    assert(txnSuccessful.verifiedBy.toString() === librarian._id.toString(), "verifiedBy recorded as librarian user ID");

    // Check that rental penalty was cleared
    const updatedRental = await Rental.findById(rental._id);
    assert(updatedRental.penaltyAmount === 0, "Associated rental penaltyAmount cleared to 0");

    console.log("\n--- TEST 4: Duplicate Verification Prevention ---");
    const resDuplicateVerify = createMockRes();
    await verifyPayment(reqVerify, resDuplicateVerify);
    assert(resDuplicateVerify.statusCode === 400, "Duplicate verification blocked with HTTP 400");
    assert(resDuplicateVerify.jsonData.success === false, "Duplicate verification prevented to stop duplicate receipts");

    console.log("\n--- TEST 5: State 'Rejected' via Librarian Manual Rejection ---");
    // Initiate second transaction for rejection test
    const reqInitiate2 = {
      user: student,
      body: {
        bookId: book._id,
        type: "fine_payment",
        amount: 20,
      },
    };
    const resInitiate2 = createMockRes();
    await initiatePayment(reqInitiate2, resInitiate2);
    const txn2 = resInitiate2.jsonData.data;

    // Student submits fake UTR
    const reqSubmitFakeUtr = {
      user: student,
      body: {
        transactionRef: txn2.transactionRef,
        utrNumber: "FAKE00000000",
      },
    };
    await submitUtr(reqSubmitFakeUtr, createMockRes());

    // Librarian rejects
    const reqReject = {
      user: librarian,
      body: {
        transactionRef: txn2.transactionRef,
        reason: "Reference not found on bank terminal after 24 hours.",
      },
    };
    const resReject = createMockRes();
    await rejectPayment(reqReject, resReject);

    assert(resReject.statusCode === 200, "Reject payment responds with HTTP 200");
    const txnRejected = resReject.jsonData.data;
    assert(txnRejected.status === "rejected", "Transaction state is 'rejected'");
    assert(txnRejected.rejectionReason.includes("bank terminal"), "Rejection reason saved");

    console.log("\n--- TEST 6: State 'Refunded' via processRefund ---");
    const reqRefund = {
      user: librarian,
      body: {
        rentalId: rental._id,
        amount: 50,
        note: "Refund of held security deposit",
      },
    };
    const resRefund = createMockRes();
    await processRefund(reqRefund, resRefund);

    assert(resRefund.statusCode === 200, "Process refund responds with HTTP 200");
    const txnRefunded = resRefund.jsonData.data;
    assert(txnRefunded.status === "refunded", "Transaction state is 'refunded'");
    assert(txnRefunded.type === "deposit_refund", "Transaction type is 'deposit_refund'");

    console.log("\n--- TEST 7: Query Transactions (GET /api/payments) ---");
    // Student query
    const reqGetStudent = {
      user: student,
      query: {},
    };
    const resGetStudent = createMockRes();
    await getTransactions(reqGetStudent, resGetStudent);
    assert(resGetStudent.jsonData.count >= 2, "Student retrieves their own transactions");

    // Admin query
    const reqGetAdmin = {
      user: librarian,
      query: { status: "successful" },
    };
    const resGetAdmin = createMockRes();
    await getTransactions(reqGetAdmin, resGetAdmin);
    assert(resGetAdmin.jsonData.data.every((t) => t.status === "successful"), "Admin can filter transactions by status");

    console.log("\n============================================================");
    console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("============================================================\n");
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(failed > 0 ? 1 : 0);
  }
}

runPaymentSystemTests();
