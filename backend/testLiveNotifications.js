/**
 * ============================================================================
 * BOOKNEXUS — LIVE NOTIFICATION DISPATCH TEST TO solowinterr@gmail.com
 * ============================================================================
 * Dispatches the 5 requested notifications via live Resend API:
 * 1. Welcome email
 * 2. Borrow request email
 * 3. Rental confirmation
 * 4. Payment notification & official receipt
 * 5. Due-date reminder
 * ============================================================================
 */

require("dotenv").config({ path: __dirname + "/.env" });
const emailService = require("./services/emailService");
const { renderTemplate } = require("./services/emailTemplates");

const TARGET_EMAIL = process.argv[2] || "solowinterr@gmail.com";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runLiveNotificationTests() {
  console.log("\n========================================================");
  console.log(`📨 DISPATCHING LIVE BOOKNEXUS NOTIFICATIONS TO: ${TARGET_EMAIL}`);
  console.log("========================================================\n");

  const results = [];

  // 1. Welcome Email
  console.log("1️⃣ Sending [Welcome Email]...");
  const welcomeTpl = renderTemplate("welcome", {
    name: "Winter (Scholar)",
    email: TARGET_EMAIL,
    usn: "1MS21CS042",
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });
  const res1 = await emailService.sendRawEmail({
    to: TARGET_EMAIL,
    subject: welcomeTpl.subject,
    html: welcomeTpl.html,
    text: welcomeTpl.text,
  });
  console.log(`   Result: ${res1.success ? "✅ Delivered" : "❌ Failed"} (MsgID: ${res1.messageId || res1.error})`);
  results.push({ name: "Welcome Email", ...res1 });
  await delay(1200); // 1.2s delay to comfortably stay within Resend rate limits (2 req/s on free tier)

  // 2. Borrow Request Email
  console.log("2️⃣ Sending [Borrow Request Submitted Email]...");
  const borrowTpl = renderTemplate("borrowRequestSubmitted", {
    name: "Winter",
    bookTitle: "Database System Concepts (7th Edition)",
    author: "Silberschatz, Korth & Sudarshan",
    rentalId: "BN-RENT-DB-01",
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });
  const res2 = await emailService.sendRawEmail({
    to: TARGET_EMAIL,
    subject: borrowTpl.subject,
    html: borrowTpl.html,
    text: borrowTpl.text,
  });
  console.log(`   Result: ${res2.success ? "✅ Delivered" : "❌ Failed"} (MsgID: ${res2.messageId || res2.error})`);
  results.push({ name: "Borrow Request Email", ...res2 });
  await delay(1200);

  // 3. Rental Confirmation & Counter Pickup OTP
  console.log("3️⃣ Sending [Rental Confirmation & OTP Email]...");
  const confirmTpl = renderTemplate("borrowRequestApproved", {
    name: "Winter",
    bookTitle: "Database System Concepts (7th Edition)",
    author: "Silberschatz, Korth & Sudarshan",
    rentalId: "BN-RENT-DB-01",
    pickupOtp: "839201",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });
  const res3 = await emailService.sendRawEmail({
    to: TARGET_EMAIL,
    subject: confirmTpl.subject,
    html: confirmTpl.html,
    text: confirmTpl.text,
  });
  console.log(`   Result: ${res3.success ? "✅ Delivered" : "❌ Failed"} (MsgID: ${res3.messageId || res3.error})`);
  results.push({ name: "Rental Confirmation & OTP", ...res3 });
  await delay(1200);

  // 4. Payment Notification & Official Receipt
  console.log("4️⃣ Sending [Payment Notification & Official Receipt]...");
  const receiptTpl = renderTemplate("transactionReceipt", {
    name: "Winter",
    txnRef: "BN-REC-" + Date.now().toString().slice(-6),
    amount: "150.00",
    currency: "INR",
    type: "Rental Security Deposit",
    bookTitle: "Database System Concepts (7th Edition)",
    paymentMethod: "Campus Counter UPI (Verified)",
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });
  const res4 = await emailService.sendRawEmail({
    to: TARGET_EMAIL,
    subject: receiptTpl.subject,
    html: receiptTpl.html,
    text: receiptTpl.text,
  });
  console.log(`   Result: ${res4.success ? "✅ Delivered" : "❌ Failed"} (MsgID: ${res4.messageId || res4.error})`);
  results.push({ name: "Payment Receipt", ...res4 });
  await delay(1200);

  // 5. Due-Date Reminder
  console.log("5️⃣ Sending [Due-Date Reminder Email]...");
  const dueTpl = renderTemplate("dueDateReminder", {
    name: "Winter",
    bookTitle: "Database System Concepts (7th Edition)",
    daysLeft: 2,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });
  const res5 = await emailService.sendRawEmail({
    to: TARGET_EMAIL,
    subject: dueTpl.subject,
    html: dueTpl.html,
    text: dueTpl.text,
  });
  console.log(`   Result: ${res5.success ? "✅ Delivered" : "❌ Failed"} (MsgID: ${res5.messageId || res5.error})`);
  results.push({ name: "Due-Date Reminder", ...res5 });

  console.log("\n========================================================");
  console.log("📊 LIVE NOTIFICATION DISPATCH SUMMARY");
  console.log("========================================================");
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.name}: ${r.success ? "✅ DISPATCHED" : "❌ ERROR"} (ID: ${r.messageId || r.error})`);
  });
  console.log("========================================================\n");
}

runLiveNotificationTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
