/**
 * ============================================================================
 * BOOKNEXUS — VERIFY ALL NOTIFICATION FLOWS
 * ============================================================================
 * Verifies the 7 required notification workflows:
 * 1. Login (Sign-In Alert)
 * 2. Logout (Sign-Out Notice)
 * 3. Rental (Rental Confirmation & Started)
 * 4. Borrowed (Request Submitted & Approved)
 * 5. Pending (Status Pending Review)
 * 6. Penalty (Overdue Notice & Late Fine)
 * 7. Return (Return Confirmed & Rental Completed)
 * ============================================================================
 */

require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const emailService = require("./services/emailService");
const emailEventService = require("./services/emailEventService");
const emailWorker = require("./services/emailWorker");
const { renderTemplate } = require("./services/emailTemplates");
const User = require("./models/user");
const Book = require("./models/book");
const Rental = require("./models/rental");
const EmailOutbox = require("./models/emailOutbox");

const TARGET_EMAIL = process.env.RESEND_TEST_RECIPIENT || "solowinterr@gmail.com";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("\n========================================================");
  console.log("🔍 BOOKNEXUS NOTIFICATION WORKFLOW VERIFICATION");
  console.log("========================================================\n");

  await connectDB();

  // 1. Resend Configuration Check (without exposing key)
  const isKeyConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().startsWith("re_"));
  const domainStatus = await emailService.getDomainStatus();
  console.log("1. Resend Configuration Check:");
  console.log(`   - API Key Present & Format Valid: ${isKeyConfigured ? "✅ YES (Format: re_...)" : "❌ NO"}`);
  console.log(`   - Sender Address:                 ${process.env.EMAIL_FROM || "onboarding@resend.dev"}`);
  console.log(`   - Sender Name:                    ${process.env.EMAIL_FROM_NAME || "BookNexus"}`);
  console.log(`   - Verified Test Target:           ${TARGET_EMAIL}`);
  console.log(`   - Provider Status:                ${domainStatus.status || "active"}\n`);

  // 2. Resolve or create test user
  let testUser = await User.findOne({ email: TARGET_EMAIL });
  if (!testUser) {
    testUser = await User.create({
      name: "Verified Scholar",
      email: TARGET_EMAIL,
      role: "student",
      usn: "USN-DEMO01",
    });
  }

  let testBook = await Book.findOne({ title: "Distributed Systems Concepts" });
  if (!testBook) {
    testBook = await Book.create({
      title: "Distributed Systems Concepts",
      author: "Coulouris & Dollimore",
      genre: "Engineering",
      subject: "Computer Science",
      availableCopies: 5,
      totalCopies: 5,
    });
  }

  const results = [];

  // Helper for tracking
  async function testNotification(name, eventFn) {
    console.log(`Testing [${name}]...`);
    try {
      const res = await eventFn();
      let dispatched = false;
      let msgId = null;

      if (res && res.outboxId) {
        const outbox = await EmailOutbox.findById(res.outboxId);
        if (outbox) {
          const outcome = await emailWorker.processJob(outbox);
          if (outcome && outcome.status === "sent") {
            dispatched = true;
            msgId = outcome.job.providerMessageId;
          } else {
            msgId = outcome ? outcome.error : "Failed";
          }
        }
      } else if (res && res.success) {
        dispatched = true;
        msgId = res.eventId || "Queued";
      }

      console.log(`   Result: ${dispatched ? "✅ DISPATCHED" : "❌ FAILED"} (MsgID: ${msgId})`);
      results.push({ name, success: dispatched, msgId });
    } catch (err) {
      console.log(`   Result: ❌ ERROR (${err.message})`);
      results.push({ name, success: false, error: err.message });
    }
    await delay(1200); // Respect Resend free-tier rate limits (2 req/s)
  }

  // A. LOGIN NOTIFICATION
  await testNotification("Login Notification", async () => {
    return emailEventService.onUserLogin(testUser, {
      time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      device: "Edge on Windows 11",
      ip: "127.0.0.1",
    });
  });

  // B. LOGOUT NOTIFICATION
  await testNotification("Logout Notification", async () => {
    return emailEventService.onUserLogout(testUser, {
      time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      device: "Edge on Windows 11",
    });
  });

  // C. BORROWED: REQUEST SUBMITTED
  const mockRental = {
    _id: new mongoose.Types.ObjectId(),
    pickupOtp: "948102",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  };
  await testNotification("Borrowed (Request Submitted)", async () => {
    return emailEventService.onBorrowSubmitted(mockRental, testUser, testBook);
  });

  // D. BORROWED: REQUEST APPROVED
  await testNotification("Borrowed (Request Approved & Pickup OTP)", async () => {
    return emailEventService.onBorrowApproved(mockRental, testUser, testBook);
  });

  // E. PENDING NOTIFICATION
  await testNotification("Pending Notification (Awaiting Review)", async () => {
    return emailEventService.queueEmailEvent({
      eventType: "borrow.pending",
      category: "rentals",
      recipient: testUser,
      relatedRentalId: mockRental._id,
      relatedBookId: testBook._id,
      templateName: "borrowRequestPending",
      templateData: {
        bookTitle: testBook.title,
        rentalId: mockRental._id.toString(),
      },
    });
  });

  // F. RENTAL: CONFIRMATION & STARTED
  await testNotification("Rental Notification (Rental Started)", async () => {
    return emailEventService.onRentalStarted(mockRental, testUser, testBook);
  });

  // G. PENALTY: OVERDUE FINE NOTIFICATION
  await testNotification("Penalty Notification (Overdue Alert & Fine Details)", async () => {
    return emailEventService.onOverdueNotice(mockRental, testUser, testBook, {
      daysOverdue: 4,
      finePerDay: 10,
      totalPenalty: 40,
    });
  });

  // H. RETURN NOTIFICATION
  await testNotification("Return Notification (Return Confirmed & Deposit Refunded)", async () => {
    return emailEventService.onRentalCompleted(mockRental, testUser, testBook, {
      depositRefunded: 150,
      txHash: "0x3a4f89d2c1e8471b059382104812",
    });
  });

  console.log("\n========================================================");
  console.log("📊 NOTIFICATION VERIFICATION SUMMARY");
  console.log("========================================================");
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.name.padEnd(45)}: ${r.success ? "✅ WORKING" : "❌ FAILED"} (${r.msgId || r.error || ""})`);
  });
  console.log("========================================================\n");

  const allPassed = results.every((r) => r.success);
  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error("FATAL RUN ERROR:", err);
  process.exit(1);
});

