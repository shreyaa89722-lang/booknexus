const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const EmailOutbox = require("../models/emailOutbox");

/**
 * Verifies Svix / Resend webhook signature
 */
function verifyResendSignature(payloadRaw, headers, secret) {
  if (!secret) return { valid: true, warning: "no_secret_configured" };

  const svixId = headers["svix-id"];
  const svixTimestamp = headers["svix-timestamp"];
  const svixSignature = headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { valid: false, error: "Missing required svix headers" };
  }

  // Check timestamp drift (5 minute tolerance)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(svixTimestamp, 10);
  if (Math.abs(now - ts) > 300) {
    return { valid: false, error: "Webhook timestamp expired / out of range" };
  }

  try {
    // Secret format can be "whsec_..."
    const secretKey = secret.startsWith("whsec_") ? secret.substring(6) : secret;
    const secretBytes = Buffer.from(secretKey, "base64");
    const signedContent = `${svixId}.${svixTimestamp}.${payloadRaw}`;
    const expectedSig = crypto
      .createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");

    const passedSigs = svixSignature.split(" ");
    const isValid = passedSigs.some((sig) => {
      const actualSig = sig.startsWith("v1,") ? sig.substring(3) : sig;
      return crypto.timingSafeEqual(Buffer.from(actualSig), Buffer.from(expectedSig));
    });

    return { valid: isValid, error: isValid ? null : "Invalid signature match" };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * @desc   Handle Resend webhook delivery updates
 * @route  POST /api/webhooks/resend
 */
const handleResendWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  const rawBody = req.rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

  if (secret) {
    const verif = verifyResendSignature(rawBody, req.headers, secret);
    if (!verif.valid) {
      console.warn("[EmailWebhook] ⛔ Webhook signature verification failed:", verif.error);
      return res.status(401).json({ success: false, message: verif.error });
    }
  }

  const payload = req.body;
  const eventType = payload.type; // e.g. "email.delivered", "email.bounced"
  const emailData = payload.data || {};
  const emailId = emailData.email_id || emailData.id;

  if (!emailId) {
    return res.status(400).json({ success: false, message: "Missing email identifier in webhook payload" });
  }

  console.log(`[EmailWebhook] 📨 Received Resend webhook: ${eventType} for message ${emailId}`);

  // Find matching Outbox entry
  const outbox = await EmailOutbox.findOne({ providerMessageId: emailId });
  if (outbox) {
    const eventRecord = {
      status: eventType,
      timestamp: new Date(),
      details: emailData,
    };

    if (eventType === "email.delivered") {
      outbox.status = "delivered";
      outbox.deliveredAt = new Date();
    } else if (eventType === "email.bounced") {
      outbox.status = "bounced";
      outbox.lastError = emailData.bounce_type || "Bounced";
    } else if (eventType === "email.complained") {
      outbox.status = "bounced";
      outbox.lastError = "Spam complaint received";
    }

    outbox.deliveryEvents.push(eventRecord);
    await outbox.save();
  }

  res.status(200).json({ success: true, processed: !!outbox });
});

module.exports = {
  verifyResendSignature,
  handleResendWebhook,
};
