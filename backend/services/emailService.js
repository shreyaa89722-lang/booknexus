require("dotenv").config();
const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const Notification = require("../models/notification");
const templates = require("./emailTemplates");

// In-memory fallback buffer of recent notifications (keeps up to 100 recent)
const recentNotifications = [];

/**
 * Resolves configured Resend client instance
 */
let resendClient = null;
function getResendClient() {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (apiKey && !apiKey.includes("your_api_key_here") && !resendClient) {
    try {
      resendClient = new Resend(apiKey);
    } catch (err) {
      console.warn("[EmailService] Resend initialization warning:", err.message);
    }
  }
  return resendClient;
}

/**
 * Resolves optional fallback Nodemailer SMTP transporter
 */
let smtpTransporter = null;
function getSmtpTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && !smtpTransporter) {
    try {
      smtpTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
    } catch (err) {
      console.warn("[EmailService] SMTP transporter initialization notice:", err.message);
    }
  }
  return smtpTransporter;
}

/**
 * Validates an email address format
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * Checks Resend domain verification status (if API key is present)
 */
async function getDomainStatus() {
  const resend = getResendClient();
  if (!resend) {
    return {
      configured: false,
      status: "unconfigured",
      message: "RESEND_API_KEY is not configured in backend environment variables.",
      domains: [],
    };
  }

  try {
    const { data, error } = await resend.domains.list();
    if (error) {
      return {
        configured: true,
        status: "error",
        message: error.message,
        domains: [],
      };
    }
    const domains = (data && data.data) || [];
    return {
      configured: true,
      status: domains.some((d) => d.status === "verified") ? "verified" : "pending_verification",
      message: "Resend connected. Sender domains fetched.",
      domains,
    };
  } catch (err) {
    return {
      configured: true,
      status: "error",
      message: err.message,
      domains: [],
    };
  }
}

/**
 * Low-level Raw Email Delivery function
 * Dispatches via Resend API (primary), SMTP (secondary), or Simulated mode (development fallback).
 */
async function sendRawEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
  headers = {},
  tags = [],
}) {
  const cleanTo = (to || "").toLowerCase().trim();
  if (!isValidEmail(cleanTo)) {
    return {
      success: false,
      error: `Invalid recipient email address: "${cleanTo}"`,
      provider: "none",
      simulated: false,
    };
  }

  const senderName = process.env.EMAIL_FROM_NAME || "BookNexus";
  const senderEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const formattedFrom = from || `${senderName} <${senderEmail}>`;
  const cleanReplyTo = replyTo || process.env.EMAIL_REPLY_TO || undefined;

  // 1. Try Resend Delivery
  const resend = getResendClient();
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: formattedFrom,
        to: [cleanTo],
        subject: subject,
        html: html,
        text: text || templates.stripHtmlToText(html),
        reply_to: cleanReplyTo,
        headers: headers,
        tags: tags,
      });

      if (response && response.error) {
        const errorMsg = response.error.message || "";
        console.warn(`[EmailService] ⚠️ Resend API returned error for <${cleanTo}>:`, errorMsg);

        // FREE-TIER DEMO ROUTING:
        // When using Resend's free sandbox domain (onboarding@resend.dev), Resend strictly restricts delivery
        // to the account owner's email address. We safely forward the notification to your verified test recipient
        // so all 23+ email events can be demonstrated live without purchasing a custom domain!
        const testRecipient = (process.env.RESEND_TEST_RECIPIENT || "solowinterr@gmail.com").toLowerCase().trim();
        const isSandboxRestricted =
          errorMsg.includes("testing emails to your own email address") ||
          errorMsg.includes("verify a domain");

        if (isSandboxRestricted && testRecipient && cleanTo !== testRecipient) {
          console.log(`[EmailService] 🔄 Free-Tier Demo Route: Rerouting notification for <${cleanTo}> to verified inbox <${testRecipient}>`);
          try {
            const demoSubject = `[Demo: ${cleanTo}] ${subject}`;
            const demoBanner = `<div style="background:#FAF7F2;border-left:4px solid #D97706;padding:12px;margin-bottom:16px;font-family:sans-serif;font-size:13px;color:#78350F;"><strong>ℹ️ Resend Free Tier Demo Mode:</strong> This notification was generated for student <code>${cleanTo}</code> and delivered to your verified test address for demonstration.</div>`;
            const demoHtml = demoBanner + html;

            const demoResponse = await resend.emails.send({
              from: formattedFrom,
              to: [testRecipient],
              subject: demoSubject,
              html: demoHtml,
              text: `[Demo for: ${cleanTo}]\n\n` + (text || templates.stripHtmlToText(html)),
              reply_to: cleanReplyTo,
              headers: headers,
              tags: [...tags, { name: "demo_original_recipient", value: cleanTo.replace(/[^a-zA-Z0-9_-]/g, "_") }],
            });

            if (demoResponse && demoResponse.data) {
              const demoMsgId = demoResponse.data.id;
              console.log(`[EmailService] ✅ Demo email delivered via Resend to <${testRecipient}> (MsgID: ${demoMsgId})`);
              return {
                success: true,
                messageId: demoMsgId,
                provider: "resend",
                simulated: false,
                demoRerouted: true,
                originalRecipient: cleanTo,
              };
            }
          } catch (demoErr) {
            console.warn(`[EmailService] Demo reroute exception:`, demoErr.message);
          }
        }

        return {
          success: false,
          error: errorMsg,
          provider: "resend",
          simulated: false,
        };
      }

      const messageId = response && response.data ? response.data.id : ("resend-" + Date.now());
      console.log(`[EmailService] ✅ Email dispatched via Resend to <${cleanTo}> (MsgID: ${messageId})`);
      return {
        success: true,
        messageId: messageId,
        provider: "resend",
        simulated: false,
      };
    } catch (apiError) {
      console.error(`[EmailService] ❌ Resend network/request exception:`, apiError.message);
      return {
        success: false,
        error: apiError.message,
        provider: "resend",
        simulated: false,
      };
    }
  }

  // 2. Try Fallback SMTP
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const mailOptions = {
        from: formattedFrom,
        to: cleanTo,
        subject: subject,
        html: html,
        text: text || templates.stripHtmlToText(html),
        replyTo: cleanReplyTo,
        headers: headers,
      };
      const info = await smtp.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Email delivered via SMTP to <${cleanTo}> (MsgID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        provider: "smtp",
        simulated: false,
      };
    } catch (smtpErr) {
      console.warn(`[EmailService] ⚠️ SMTP transport error:`, smtpErr.message);
      // Fall through to simulation if in dev
    }
  }

  // 3. Fallback Simulated Mode (for local dev & testing without active Resend API key)
  const simulatedId = "sim-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);
  console.log(`[EmailService] 📧 Simulated Email to <${cleanTo}>: "${subject}" (Simulated ID: ${simulatedId})`);
  return {
    success: true,
    messageId: simulatedId,
    provider: "simulated",
    simulated: true,
  };
}

/**
 * Dispatches an email notification and mirrors to in-app Notification DB & memory buffer
 */
const dispatchNotification = async ({
  user,
  userEmail,
  type,
  title,
  subject,
  html,
  preview,
  meta = {},
}) => {
  const targetEmail = (userEmail || (user && user.email) || "").toLowerCase().trim();
  if (!targetEmail) {
    console.warn("[EmailService] No recipient email specified for notification dispatch.");
    return null;
  }

  // 1. Send via email transport
  const sendResult = await sendRawEmail({
    to: targetEmail,
    subject: subject,
    html: html,
  });

  const notificationRecord = {
    user: user && user._id ? user._id : null,
    userEmail: targetEmail,
    type,
    title,
    subject,
    preview: preview || title,
    html,
    meta,
    isRead: false,
    deliveryStatus: sendResult.simulated ? "simulated" : sendResult.success ? "sent" : "failed",
    messageId: sendResult.messageId || null,
    createdAt: new Date(),
  };

  // 2. Keep in in-memory buffer
  recentNotifications.unshift(notificationRecord);
  if (recentNotifications.length > 100) recentNotifications.pop();

  // 3. Persist to MongoDB
  try {
    const savedDoc = await Notification.create(notificationRecord);
    return savedDoc;
  } catch (dbErr) {
    console.warn("[EmailService] Notification DB save notice:", dbErr.message);
    return notificationRecord;
  }
};

// ---------------------------------------------------------------------------
// Standard Direct Helper Methods (backward-compatible)
// ---------------------------------------------------------------------------

const sendSignInNotification = async (user, details = {}) => {
  const email = user.email;
  const name = user.name || email.split("@")[0];
  const rendered = templates.renderTemplate("signIn", {
    name,
    email,
    time: details.time,
    device: details.device,
    ip: details.ip,
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });

  return dispatchNotification({
    user,
    userEmail: email,
    type: "sign_in",
    title: "Sign-In Alert: Account accessed",
    subject: rendered.subject,
    preview: `New sign-in detected on your Book Nexus account (${email})`,
    html: rendered.html,
    meta: details,
  });
};

const sendBookBuyingNotification = async (user, book = {}, rental = {}) => {
  const email = user.email;
  const name = user.name || email.split("@")[0];
  const rendered = templates.renderTemplate("rentalConfirmation", {
    name,
    bookTitle: book.title || "Academic Textbook",
    author: book.author || "Department Author",
    rentalId: rental._id || rental.id,
    price: book.rentalPrice || book.price || 0,
    dueDate: rental.dueDate,
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });

  return dispatchNotification({
    user,
    userEmail: email,
    type: "book_buying",
    title: `Order Confirmed: ${book.title || "Academic Textbook"}`,
    subject: rendered.subject,
    preview: `Your order for "${book.title || "Academic Textbook"}" has been placed in Book Nexus.`,
    html: rendered.html,
    meta: { bookId: book._id, rentalId: rental._id },
  });
};

const sendPendingNotification = async (user, book = {}, rental = {}) => {
  const email = user.email;
  const name = user.name || email.split("@")[0];
  const rendered = templates.renderTemplate("borrowRequestPending", {
    name,
    bookTitle: book.title || "Requested Book",
    rentalId: rental._id || rental.id,
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });

  return dispatchNotification({
    user,
    userEmail: email,
    type: "pending",
    title: `Status Pending: ${book.title || "Requested Book"}`,
    subject: rendered.subject,
    preview: `Your request for "${book.title || "Requested Book"}" is currently under review by the library desk.`,
    html: rendered.html,
    meta: { bookId: book._id, rentalId: rental._id },
  });
};

const sendBookAcceptedNotification = async (user, book = {}, rental = {}) => {
  const email = user.email;
  const name = user.name || email.split("@")[0];
  const rendered = templates.renderTemplate("borrowRequestApproved", {
    name,
    bookTitle: book.title || "Reserved Book",
    author: book.author,
    rentalId: rental._id || rental.id,
    pickupLocation: "Main Library Circulation Desk (Counter #2)",
    pickupOtp: rental.pickupOtp,
    dueDate: rental.dueDate,
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });

  return dispatchNotification({
    user,
    userEmail: email,
    type: "accepted",
    title: `Request Accepted: ${book.title || "Reserved Book"}`,
    subject: rendered.subject,
    preview: `Your book is ready! Pickup OTP: ${rental.pickupOtp || "Generated"}.`,
    html: rendered.html,
    meta: { bookId: book._id, rentalId: rental._id, pickupOtp: rental.pickupOtp },
  });
};

const sendOtpNotification = async (user, otp, purpose = "Verification", meta = {}) => {
  const email = user.email;
  const name = user.name || email.split("@")[0];
  const html = templates.otpEmail({
    name,
    otp,
    purpose,
    expiryMinutes: meta.expiryMinutes || 10,
    bookTitle: meta.bookTitle,
  });

  return dispatchNotification({
    user,
    userEmail: email,
    type: "otp",
    title: `Your OTP Code: ${otp}`,
    subject: `Book Nexus Verification Code: ${otp}`,
    preview: `Your one-time password (OTP) code is ${otp}. Valid for 10 minutes.`,
    html,
    meta: { otp, purpose, ...meta },
  });
};

const sendSuccessfullyReceivedNotification = async (user, book = {}, rental = {}) => {
  const email = user.email;
  const name = user.name || email.split("@")[0];
  const rendered = templates.renderTemplate("borrowStarted", {
    name,
    bookTitle: book.title || "Academic Title",
    rentalId: rental._id || rental.id,
    dueDate: rental.dueDate,
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });

  return dispatchNotification({
    user,
    userEmail: email,
    type: "successfully_received",
    title: `Book Received: ${book.title || "Academic Title"}`,
    subject: rendered.subject,
    preview: `Your rental period for "${book.title || "Academic Title"}" is now active.`,
    html: rendered.html,
    meta: { bookId: book._id, rentalId: rental._id },
  });
};

const sendPenaltyNotification = async (user, book = {}, rental = {}, fineDetails = {}) => {
  const email = user.email;
  const name = user.name || email.split("@")[0];
  const rendered = templates.renderTemplate("overdueNotice", {
    name,
    bookTitle: book.title || "Academic Textbook",
    rentalId: rental._id || rental.id,
    dueDate: rental.dueDate,
    daysOverdue: fineDetails.daysOverdue || 3,
    finePerDay: fineDetails.finePerDay || 10,
    totalPenalty: fineDetails.totalPenalty || 30,
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });

  return dispatchNotification({
    user,
    userEmail: email,
    type: "penalty",
    title: `Overdue Notice & Penalty: ${book.title || "Academic Textbook"}`,
    subject: rendered.subject,
    preview: `Your book "${book.title || "Academic Textbook"}" is overdue. Current penalty: ₹${fineDetails.totalPenalty || 30}.`,
    html: rendered.html,
    meta: { bookId: book._id, rentalId: rental._id, ...fineDetails },
  });
};

const sendOverallCompletedNotification = async (user, book = {}, rental = {}) => {
  const email = user.email;
  const name = user.name || email.split("@")[0];
  const rendered = templates.renderTemplate("rentalCompleted", {
    name,
    bookTitle: book.title || "Academic Title",
    rentalId: rental._id || rental.id,
    returnDate: rental.returnDate || new Date(),
    depositRefunded: rental.depositRefunded || 0,
    txHash: rental.returnTxHash,
    appUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  });

  return dispatchNotification({
    user,
    userEmail: email,
    type: "completed",
    title: `Rental Completed: ${book.title || "Academic Title"}`,
    subject: rendered.subject,
    preview: `"${book.title || "Academic Title"}" was checked in and your rental cycle is 100% completed.`,
    html: rendered.html,
    meta: { bookId: book._id, rentalId: rental._id },
  });
};

const sendEmail = async (to, subject, html) => {
  return sendRawEmail({ to, subject, html });
};

module.exports = {
  sendRawEmail,
  sendTransactionalEmail: sendRawEmail,
  sendEmail,
  isValidEmail,
  getDomainStatus,
  dispatchNotification,
  recentNotifications,
  sendSignInNotification,
  sendBookBuyingNotification,
  sendPendingNotification,
  sendBookAcceptedNotification,
  sendOtpNotification,
  sendSuccessfullyReceivedNotification,
  sendPenaltyNotification,
  sendOverallCompletedNotification,
};