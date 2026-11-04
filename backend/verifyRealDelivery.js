/**
 * ============================================================================
 * BOOKNEXUS — REAL EMAIL DELIVERY VERIFICATION SCRIPT
 * ============================================================================
 * Run this script to verify real email delivery using your Resend account.
 *
 * Usage:
 *   node verifyRealDelivery.js <recipient-email>
 *
 * Example:
 *   node verifyRealDelivery.js student@example.com
 * ============================================================================
 */

require("dotenv").config({ path: __dirname + "/.env" });
const emailService = require("./services/emailService");
const { renderEmailTemplate } = require("./services/emailTemplates");

async function verifyDelivery() {
  const recipient = process.argv[2] || process.env.EMAIL_REPLY_TO || "test@example.com";
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const fromName = process.env.EMAIL_FROM_NAME || "BookNexus";

  console.log("\n========================================================");
  console.log("📨 BOOKNEXUS REAL EMAIL DELIVERY VERIFICATION");
  console.log("========================================================\n");

  console.log(`Configuration Check:`);
  console.log(`- RESEND_API_KEY:       ${apiKey ? apiKey.slice(0, 7) + "..." : "NOT SET (Running in Simulation Mode)"}`);
  console.log(`- EMAIL_FROM:           ${fromEmail}`);
  console.log(`- EMAIL_FROM_NAME:       ${fromName}`);
  console.log(`- Target Recipient:     ${recipient}\n`);

  if (!apiKey || apiKey.trim() === "") {
    console.warn("⚠️ WARNING: RESEND_API_KEY is currently empty in backend/.env.");
    console.warn("The email system is currently running in SIMULATED mode.");
    console.warn("\nTo enable live email delivery to real student inboxes:");
    console.warn("1. Sign up at https://resend.com");
    console.warn("2. Verify your sending domain (e.g., booknexus.edu) or use your free test address (e.g. delivered@resend.dev / onboarding@resend.dev)");
    console.warn("3. Create an API Key under Resend Dashboard -> API Keys");
    console.warn("4. Set RESEND_API_KEY=re_... in backend/.env\n");
  }

  console.log(`Rendering sample 'borrowRequestApproved' template...`);
  const rendered = renderEmailTemplate("borrowRequestApproved", {
    name: "BookNexus Student",
    email: recipient,
    bookTitle: "Distributed Systems: Concepts and Design",
    author: "George Coulouris",
    rentalId: "BN-RENT-LIVE-VERIF",
    pickupOtp: "839201",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });

  console.log(`Dispatching transactional email to <${recipient}>...`);
  try {
    const result = await emailService.sendTransactionalEmail({
      to: recipient,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      category: "rentals",
      tags: [{ name: "test_type", value: "live_verification" }],
    });

    console.log("\n========================================================");
    if (result.simulated) {
      console.log("✅ SIMULATION SUCCESSFUL");
      console.log(`Simulated Message ID: ${result.messageId}`);
      console.log(`Mode: Simulated (RESEND_API_KEY not configured)`);
    } else {
      console.log("🎉 LIVE DELIVERY SUCCESSFUL!");
      console.log(`Provider: Resend`);
      console.log(`Resend Message ID: ${result.messageId}`);
      console.log(`Status: Transmitted to Resend API`);
      console.log(`Check recipient inbox at: ${recipient}`);
    }
    console.log("========================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ DELIVERY FAILED:");
    console.error(`Error: ${err.message}`);
    if (err.message.includes("domain") || err.message.includes("verify")) {
      console.error("\nDNS Verification Assistance:");
      console.error("Resend requires domain verification for custom sender domains.");
      console.error("Add the following records to your domain's DNS provider:");
      console.error("1. TXT record: resend._domainkey.yourdomain.com -> value from Resend dashboard");
      console.error("2. MX record: feedback-smtp.resend.com -> priority 10");
      console.error("3. SPF TXT record: 'v=spf1 include:resend.com ~all'");
    }
    process.exit(1);
  }
}

verifyDelivery();
