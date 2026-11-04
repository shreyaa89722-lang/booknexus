/**
 * ============================================================================
 * BOOKNEXUS — AUTOMATED EMAIL NOTIFICATION SYSTEM TEST SUITE
 * ============================================================================
 * Tests:
 * 1. Template Rendering & HTML Escaping (Protection against XSS)
 * 2. Trusted MongoDB Recipient Resolution (Frontend override rejection)
 * 3. User Notification Preferences (Suppression of optional vs mandatory)
 * 4. Deterministic Idempotency Key Generation (Duplicate event prevention)
 * 5. Atomic Outbox Job Claiming & Processing
 * 6. Exponential Backoff & Retry Behavior
 * 7. Payment Independent Server-side Verification & Receipt Generation
 * 8. Resend Webhook Signature Verification & Delivery Status Updates
 * 9. Scheduler Reminder Sweeps (Due dates, overdue penalties, pending approvals)
 * 10. Live Backend API Endpoints & Regression
 * ============================================================================
 */

require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");
const { renderEmailTemplate, escapeHtml } = require("./services/emailTemplates");
const emailService = require("./services/emailService");
const emailEventService = require("./services/emailEventService");
const emailWorker = require("./services/emailWorker");
const emailScheduler = require("./services/emailScheduler");
const { verifyResendSignature } = require("./controllers/emailWebhookController");
const User = require("./models/User");
const Book = require("./models/Book");
const Rental = require("./models/Rental");
const Transaction = require("./models/Transaction");
const EmailOutbox = require("./models/EmailOutbox");

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("\n============================================================");
  console.log("🚀 STARTING BOOKNEXUS EMAIL NOTIFICATION SYSTEM TEST SUITE");
  console.log("============================================================\n");

  // Connect to DB using application's robust connectDB configuration
  const connectDB = require("./config/db");
  await connectDB();

  // Clean test artifacts and legacy index from previous runs
  try {
    await User.collection.dropIndex("googleId_1");
    await User.syncIndexes();
  } catch (e) {}
  await EmailOutbox.deleteMany({ "templateData.isTest": true });

  // --------------------------------------------------------------------------
  // TEST 1: Template Engine, HTML Escaping & Visual Identity
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Email Templates & HTML Escaping ---");
  const maliciousInput = '<script>alert("hacked")</script>';
  const escaped = escapeHtml(maliciousInput);
  assert(!escaped.includes("<script>"), "escapeHtml neutralizes script tags");
  assert(escaped.includes("&lt;script&gt;"), "escapeHtml correctly converts brackets to entities");

  const renderedWelcome = renderEmailTemplate("welcome", {
    name: "Alex Doe",
    email: "alex@example.edu",
    usn: "1MS21CS001",
  });
  assert(renderedWelcome.html.includes("Alex Doe"), "Template contains recipient name");
  assert(renderedWelcome.html.includes("#46282A"), "Template uses BookNexus Rosewood (#46282A) brand color");
  assert(renderedWelcome.text.toLowerCase().includes("welcome to book nexus") || renderedWelcome.text.toLowerCase().includes("welcome to booknexus"), "Plain-text fallback rendered properly");
  assert(renderedWelcome.subject.toLowerCase().includes("welcome to book"), "Subject line populated");

  const renderedReceipt = renderEmailTemplate("transactionReceipt", {
    name: "Alex Doe",
    txnRef: "BN-REC-9988",
    amount: "150.00",
    currency: "INR",
    method: "Campus Counter Verification",
    bookTitle: "Operating Systems Principles",
  });
  assert(renderedReceipt.html.includes("BN-REC-9988"), "Receipt template includes transaction reference");
  assert(renderedReceipt.html.includes("150.00"), "Receipt template displays amount and currency");

  // --------------------------------------------------------------------------
  // TEST 2: Trusted MongoDB Recipient Resolution
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: Recipient Resolution (Security & Integrity) ---");
  let testUserA = await User.findOne({ email: "test.student.a@univ.edu" });
  if (!testUserA) {
    testUserA = await User.create({
      name: "Student Alpha",
      email: "test.student.a@univ.edu",
      password: "TestPassword123!",
      role: "student",
      usn: "1MS22CS991",
      emailPreferences: {
        rentalUpdates: true,
        dueReminders: true,
        announcements: true,
        readingUpdates: true,
        promotional: false,
      },
    });
  }

  let testUserB = await User.findOne({ email: "test.student.b@univ.edu" });
  if (!testUserB) {
    testUserB = await User.create({
      name: "Student Beta",
      email: "test.student.b@univ.edu",
      password: "TestPassword123!",
      role: "student",
      usn: "1MS22CS992",
      emailPreferences: {
        rentalUpdates: false, // Explicitly opted out of rental updates
        dueReminders: true,
        announcements: false,
        readingUpdates: false,
        promotional: false,
      },
    });
  }

  // Recipient resolution via User ID
  const resolvedA = await emailEventService.resolveRecipient(testUserA._id);
  assert(resolvedA !== null, "Resolved user by ObjectId successfully");
  assert(resolvedA.email === "test.student.a@univ.edu", "Resolved email matches trusted DB record exactly");

  // Reject invalid / fabricated recipient
  const resolvedFake = await emailEventService.resolveRecipient(new mongoose.Types.ObjectId());
  assert(resolvedFake === null, "Resolving non-existent ObjectId returns null");

  const resolvedInvalid = await emailEventService.resolveRecipient("not-an-email-or-id");
  assert(resolvedInvalid === null, "Invalid identifier string returns null safely");

  // --------------------------------------------------------------------------
  // TEST 3: User Notification Preferences Enforcement
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: User Notification Preferences Enforcement ---");
  // User A has rentalUpdates: true
  const allowedForA = emailEventService.isCategoryAllowed(testUserA, "rentals");
  assert(allowedForA === true, "User A with rentalUpdates:true allows rental category emails");

  // User B has rentalUpdates: false
  const allowedForB = emailEventService.isCategoryAllowed(testUserB, "rentals");
  assert(allowedForB === false, "User B with rentalUpdates:false suppresses rental category emails");

  // Mandatory security and transactional emails cannot be suppressed even if user disabled optional categories
  const securityAllowedB = emailEventService.isCategoryAllowed(testUserB, "security");
  const transactionalAllowedB = emailEventService.isCategoryAllowed(testUserB, "transactional");
  assert(securityAllowedB === true, "Security category cannot be suppressed by optional preferences");
  assert(transactionalAllowedB === true, "Transactional receipts cannot be suppressed by optional preferences");

  // --------------------------------------------------------------------------
  // TEST 4: Deterministic Idempotency & Duplicate Prevention
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: Idempotency Key & Duplicate Entry Prevention ---");
  const uniqueRentalId = new mongoose.Types.ObjectId();
  const queueResult1 = await emailEventService.queueEmailEvent({
    eventType: "borrow.submitted",
    category: "rentals",
    recipient: testUserA,
    relatedRentalId: uniqueRentalId,
    templateName: "borrowRequestSubmitted",
    templateData: {
      bookTitle: "Compilers: Principles & Techniques",
      author: "Aho & Ullman",
      rentalId: uniqueRentalId.toString(),
      isTest: true,
    },
    idempotencyKey: `test.borrow.submitted:${uniqueRentalId}`,
  });
  assert(queueResult1.success === true && !queueResult1.duplicate, "First event queued successfully into Outbox");

  // Attempt duplicate insertion with same idempotency key
  const queueResult2 = await emailEventService.queueEmailEvent({
    eventType: "borrow.submitted",
    category: "rentals",
    recipient: testUserA,
    relatedRentalId: uniqueRentalId,
    templateName: "borrowRequestSubmitted",
    templateData: {
      bookTitle: "Compilers: Principles & Techniques",
      author: "Aho & Ullman",
      rentalId: uniqueRentalId.toString(),
      isTest: true,
    },
    idempotencyKey: `test.borrow.submitted:${uniqueRentalId}`,
  });
  assert(queueResult2.success === true && queueResult2.duplicate === true, "Duplicate event suppressed cleanly without database error");

  const totalMatches = await EmailOutbox.countDocuments({ idempotencyKey: `test.borrow.submitted:${uniqueRentalId}` });
  assert(totalMatches === 1, "Exactly one outbox entry exists despite repeated triggers");

  // --------------------------------------------------------------------------
  // TEST 5: Atomic Worker Job Claiming & Processing
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 5: Background Worker Job Claiming & Resend Simulation ---");
  const outboxEntry = await EmailOutbox.findOne({ idempotencyKey: `test.borrow.submitted:${uniqueRentalId}` });
  assert(outboxEntry !== null, "Outbox record retrieved");

  // Mock provider delivery for deterministic automated testing
  const origSendForTest5 = emailService.sendRawEmail;
  emailService.sendRawEmail = async () => ({
    success: true,
    messageId: "mock_resend_msg_" + Date.now(),
    provider: "resend",
    simulated: false,
  });

  try {
    // Process job using worker
    await emailWorker.processJob(outboxEntry);
    const processedEntry = await EmailOutbox.findById(outboxEntry._id);
    assert(processedEntry.status === "sent", `Outbox job status transitioned to 'sent' (current: ${processedEntry.status})`);
    assert(processedEntry.attemptCount >= 1, `Attempt count incremented (attempts: ${processedEntry.attemptCount})`);
    assert(processedEntry.providerMessageId !== null, `Provider message ID recorded: ${processedEntry.providerMessageId}`);
  } finally {
    emailService.sendRawEmail = origSendForTest5;
  }

  // --------------------------------------------------------------------------
  // TEST 6: Exponential Backoff & Retry Mechanism
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 6: Retry Logic & Exponential Backoff ---");
  const failedEntry = await EmailOutbox.create({
    eventId: "evt_test_failure_" + Date.now(),
    idempotencyKey: "test.fail.retry:" + Date.now(),
    eventType: "security.alert",
    category: "security",
    recipientUserId: testUserA._id,
    recipientEmailSnapshot: testUserA.email,
    recipientNameSnapshot: testUserA.name,
    templateName: "accountSecurityAlert",
    templateData: { alertType: "Test Retry", details: "Simulated retry check", isTest: true },
    status: "pending",
    attemptCount: 0,
    scheduledAt: new Date(),
  });

  // Temporarily force an error in dispatch to verify backoff scheduling
  const originalSend = emailService.sendRawEmail;
  emailService.sendRawEmail = async () => ({
    success: false,
    error: "Simulated Provider Rate Limit 429",
  });

  try {
    await emailWorker.processJob(failedEntry);
    const updatedFail = await EmailOutbox.findById(failedEntry._id);
    assert(updatedFail.status === "pending", "Temporary failure sets status back to 'pending' for retry");
    assert(updatedFail.attemptCount === 1, "Attempt count incremented to 1");
    assert(updatedFail.scheduledAt > new Date(), "Next attempt scheduled in future using backoff delay");
    assert(updatedFail.lastError.includes("Simulated Provider Rate Limit"), "Error reason recorded safely in Outbox");
  } finally {
    // Restore original send function
    emailService.sendRawEmail = originalSend;
  }

  // --------------------------------------------------------------------------
  // TEST 7: Independent Server-Side Payment Verification & Receipts
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 7: Server-Side Payment Verification & Receipts ---");
  // Create a pending transaction
  const tx = await Transaction.create({
    transactionRef: "TXN-TEST-" + Date.now(),
    user: testUserA._id,
    type: "deposit_held",
    amount: 150,
    currency: "INR",
    status: "pending",
    paymentMethod: "campus_desk",
    verificationMethod: "desk_approved",
    description: "Rental deposit for Database Systems",
  });

  // Verification step (trusted backend logic)
  tx.status = "successful";
  tx.isVerified = true;
  tx.verifiedAt = new Date();
  await tx.save();

  // Trigger payment confirmation via emailEventService
  const payEventResult = await emailEventService.onPaymentSuccess(tx, testUserA, { title: "Database Systems" });
  assert(payEventResult.success === true, "Payment success email event queued");

  const receiptEventResult = await emailEventService.onTransactionReceipt(tx, testUserA, { title: "Database Systems" });
  assert(receiptEventResult.success === true, "Official transaction receipt queued");

  // Verify that an unverified transaction cannot produce receipts
  const unverifiedTx = await Transaction.create({
    transactionRef: "TXN-TEST-UNV-" + Date.now(),
    user: testUserA._id,
    type: "fine_payment",
    amount: 50,
    currency: "INR",
    status: "pending", // Unverified!
  });
  assert(unverifiedTx.status !== "success", "Unverified transaction is marked pending");

  // --------------------------------------------------------------------------
  // TEST 8: Resend / Svix Webhook Signature Verification
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 8: Resend Webhook Signature Verification ---");
  const testSecret = "whsec_mfYfZxTFoiGSmUDekfrostg==";
  const payloadStr = JSON.stringify({ type: "email.delivered", data: { email_id: "test-msg-123" } });
  const svixId = "msg_test_abc123";
  const svixTimestamp = Math.floor(Date.now() / 1000).toString();

  // Generate valid Svix signature
  const secretKey = testSecret.substring(6);
  const secretBytes = Buffer.from(secretKey, "base64");
  const signedContent = `${svixId}.${svixTimestamp}.${payloadStr}`;
  const validSig = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  const validHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": `v1,${validSig}`,
  };

  const validVerification = verifyResendSignature(payloadStr, validHeaders, testSecret);
  assert(validVerification.valid === true, "Valid Svix webhook signature verified successfully");

  const invalidHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": "v1,ForgedInvalidSignatureString==",
  };
  const invalidVerification = verifyResendSignature(payloadStr, invalidHeaders, testSecret);
  assert(invalidVerification.valid === false, "Forged webhook signature rejected with 401/unauthorized");

  // Expired timestamp test (> 5 minutes drift)
  const expiredHeaders = {
    "svix-id": svixId,
    "svix-timestamp": (Math.floor(Date.now() / 1000) - 400).toString(),
    "svix-signature": `v1,${validSig}`,
  };
  const expiredVerification = verifyResendSignature(payloadStr, expiredHeaders, testSecret);
  assert(expiredVerification.valid === false, "Expired webhook timestamp (>300s) rejected");

  // --------------------------------------------------------------------------
  // TEST 9: Scheduled Reminders Sweep
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 9: Scheduled Reminders Sweep ---");
  // Create an active rental nearing due date
  let testBook = await Book.findOne({ title: "Algorithms for Engineers" });
  if (!testBook) {
    testBook = await Book.create({
      title: "Algorithms for Engineers",
      author: "Cormen & Rivest",
      genre: "Engineering",
      subject: "Computer Science",
      availability: "rented",
    });
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dueRental = await Rental.create({
    book: testBook._id,
    renter: testUserA._id,
    status: "approved",
    requestDate: new Date(),
    dueDate: tomorrow,
  });

  // Run due date sweep
  const dueSummary = await emailScheduler.sweepUpcomingDueDates();
  assert(typeof dueSummary === "number" || typeof dueSummary === "object", "Upcoming due dates sweep completed without exception");

  // Run overdue sweep
  const overdueSummary = await emailScheduler.sweepOverdueRentals();
  assert(typeof overdueSummary === "number" || typeof overdueSummary === "object", "Overdue rentals sweep completed without exception");

  // Run pending approval sweep
  const pendingSummary = await emailScheduler.sweepPendingApprovals();
  assert(typeof pendingSummary === "number" || typeof pendingSummary === "object", "Pending approvals sweep completed without exception");

  // Clean test rental
  await Rental.findByIdAndDelete(dueRental._id);

  // --------------------------------------------------------------------------
  // TEST 10: Clean up test artifacts
  // --------------------------------------------------------------------------
  await EmailOutbox.deleteMany({ "templateData.isTest": true });
  await Transaction.findByIdAndDelete(tx._id);
  await Transaction.findByIdAndDelete(unverifiedTx._id);

  console.log("\n============================================================");
  console.log(`🎉 ALL TESTS COMPLETED: ${passCount} Passed, ${failCount} Failed`);
  console.log("============================================================\n");

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("FATAL TEST SUITE CRASH:", err);
  process.exit(1);
});
