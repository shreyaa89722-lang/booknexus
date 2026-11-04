/**
 * BookNexus Professional Email Template Engine
 * Fully responsive, branded HTML & plain-text templates with HTML injection protection.
 * Visual Identity: Rosewood (#46282A, #6C3B3D), Cream/Parchment (#F8F5F1, #FAF7F2), Gold (#D97706, #D4A359).
 */

/**
 * Escapes HTML special characters to prevent HTML injection attacks
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Converts HTML into structured, professional plain text for text/plain email fallbacks.
 * Preserves links, list items, key-value rows, and headings for high deliverability and accessibility.
 */
function stripHtmlToText(html) {
  if (!html) return "";
  let text = String(html);

  // Remove styles and hidden preheaders
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<div\s+style=["'][^"']*display:\s*none[^"']*["']>[\s\S]*?<\/div>/gi, "");

  // Convert links cleanly: <a href="url">label</a> -> label [ url ]
  text = text.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (match, url, label) => {
    const cleanLabel = label.replace(/<[^>]+>/g, "").trim();
    if (!cleanLabel || cleanLabel === url || url.startsWith("mailto:") || url.startsWith("#")) {
      return cleanLabel || url;
    }
    return `${cleanLabel} [ ${url} ]`;
  });

  // Convert key-value rows: <div class="row">...</div>
  text = text.replace(/<div\s+class=["']row["'][^>]*>[\s\S]*?<span\s+class=["']row-label["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<span\s+class=["']row-value["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi, (match, l, v) => {
    const cleanL = l.replace(/<[^>]+>/g, "").trim();
    const cleanV = v.replace(/<[^>]+>/g, "").trim();
    return `  • ${cleanL.padEnd(20)}: ${cleanV}\n`;
  });

  // Action button conversion
  text = text.replace(/<a\s+class=["']btn["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (match, url, label) => {
    const cleanLabel = label.replace(/<[^>]+>/g, "").trim();
    return `\n>>> ${cleanLabel.toUpperCase()}: ${url} <<<\n`;
  });

  // Alert box conversion
  text = text.replace(/<div\s+class=["']alert-box[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, (match, content) => {
    const clean = content.replace(/<[^>]+>/g, "").trim();
    return `\n--------------------------------------------------\n${clean}\n--------------------------------------------------\n`;
  });

  // Headings
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (match, title) => {
    const clean = title.replace(/<[^>]+>/g, "").trim();
    return `\n=== ${clean} ===\n`;
  });

  // Block tags
  text = text
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<td[^>]*>/gi, " ")
    .replace(/<\/td>/gi, "\t")
    .replace(/<li[^>]*>/gi, "  • ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<hr[^>]*>/gi, "\n--------------------------------------------------\n")
    .replace(/<[^>]+>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&bull;/g, "•")
    .replace(/&copy;/g, "©")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();

  return text;
}

/**
 * Master BookNexus Base Layout
 */
const baseEmailLayout = ({
  title,
  previewText,
  badgeText = "System Notice",
  badgeColor = "#46282A",
  contentHtml,
  actionButton = null,
  appUrl = "http://localhost:3000",
}) => {
  const currentYear = new Date().getFullYear();
  const safeTitle = escapeHtml(title);
  const safeBadge = escapeHtml(badgeText);
  const safePreview = escapeHtml(previewText || title);
  const safeAppUrl = escapeHtml(appUrl);

  const actionHtml = actionButton
    ? `
    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${escapeHtml(actionButton.url)}" class="btn" style="display: inline-block; padding: 14px 34px; background: linear-gradient(135deg, #46282A 0%, #6C3B3D 100%); color: #FFFFFF !important; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 999px; box-shadow: 0 4px 12px rgba(70, 40, 42, 0.25); letter-spacing: 0.3px;">
        ${escapeHtml(actionButton.label)}
      </a>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #2D2424; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; max-width: 620px; margin: 28px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(70, 40, 42, 0.08); border: 1px solid rgba(70, 40, 42, 0.08); }
    .header { background: linear-gradient(135deg, #46282A 0%, #2A1517 100%); padding: 34px 30px; text-align: center; color: #FFFFFF; border-bottom: 3px solid #D97706; }
    .brand-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #FFFFFF; }
    .brand-tagline { font-size: 12px; color: #F5EBE1; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }
    .badge { display: inline-block; padding: 6px 16px; background-color: ${badgeColor}; color: #FFFFFF; font-size: 11px; font-weight: 700; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 14px; }
    .content { padding: 34px 32px 28px; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #46282A; }
    .message-text { font-size: 15px; line-height: 1.65; color: #4B4545; margin-bottom: 22px; }
    .card { background-color: #FAF7F2; border: 1px solid rgba(70, 40, 42, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed rgba(70, 40, 42, 0.12); font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #786C6C; font-weight: 500; }
    .row-value { color: #1F1919; font-weight: 700; text-align: right; }
    .otp-display { text-align: center; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 2px dashed #D97706; border-radius: 12px; padding: 18px; margin: 22px 0; }
    .otp-code { font-size: 34px; font-weight: 900; letter-spacing: 7px; color: #92400E; margin: 6px 0; font-family: 'Courier New', Courier, monospace; }
    .alert-box { padding: 14px 18px; border-radius: 8px; font-size: 13px; line-height: 1.55; margin: 18px 0; }
    .alert-warning { background-color: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }
    .alert-success { background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; }
    .alert-info { background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; }
    .footer { background-color: #FAF7F2; padding: 26px 30px; text-align: center; font-size: 12px; color: #8C8080; border-top: 1px solid rgba(70, 40, 42, 0.08); line-height: 1.6; }
    .footer-links a { color: #46282A; text-decoration: underline; margin: 0 8px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#F8F5F1;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    ${safePreview}
    &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279;
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F5F1; padding: 24px 10px;">
    <tr>
      <td align="center">
        <div class="wrapper">
          <div class="header">
            <h1 class="brand-title">📚 BookNexus</h1>
            <div class="brand-tagline">Academic Library &amp; Student Rental Sanctuary</div>
            <div><span class="badge">${safeBadge}</span></div>
          </div>
          <div class="content">
            ${contentHtml}
            ${actionHtml}
          </div>
          <div class="footer">
            <p style="margin: 0 0 6px 0;"><strong>BookNexus Library Platform</strong> &bull; Malnad College of Engineering Campus</p>
            <p style="margin: 0 0 8px 0;">This is an authenticated system notification regarding your academic account or rentals.</p>
            <div class="footer-links" style="margin-bottom: 8px;">
              <a href="${safeAppUrl}">Dashboard</a> &bull;
              <a href="${safeAppUrl}/#profile">Notification Settings</a> &bull;
              <a href="mailto:support@booknexus.local">Library Desk Support</a>
            </div>
            <p style="margin: 0; color: #A59B9B;">&copy; ${currentYear} BookNexus. All rights reserved.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ---------------------------------------------------------------------------
// 1. ACCOUNT EVENTS
// ---------------------------------------------------------------------------

const welcomeEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const email = escapeHtml(data.email || "");
  const contentHtml = `
    <div class="greeting">Welcome to BookNexus, ${name}!</div>
    <p class="message-text">Your academic library account has been successfully verified and created. You now have full access to our catalog of 580+ engineering textbooks, peer-to-peer rentals, and circulation tracking.</p>
    <div class="card">
      <div class="row"><span class="row-label">Account Holder</span><span class="row-value">${name}</span></div>
      ${email ? `<div class="row"><span class="row-label">Registered Email</span><span class="row-value">${email}</span></div>` : ""}
      <div class="row"><span class="row-label">Member Privilege</span><span class="row-value">Verified Student Scholar</span></div>
      <div class="row"><span class="row-label">Campus Branch</span><span class="row-value">Malnad College of Engineering</span></div>
    </div>
    <div class="alert-box alert-success">
      ✨ <strong>Quick Start:</strong> Browse books by semester, request zero-fee library loans, or list your own textbooks to earn rental income.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Welcome to BookNexus, ${data.name || "Scholar"}!`,
    previewText: "Your BookNexus campus library account has been successfully created.",
    badgeText: "Account Created",
    badgeColor: "#059669",
    contentHtml,
    actionButton: { label: "Explore Book Catalog", url: data.appUrl || "http://localhost:3000" },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Welcome to BookNexus, ${data.name || "Scholar"}!`, html, text: stripHtmlToText(html) };
};

const signInEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const email = escapeHtml(data.email || "Your Account");
  const time = escapeHtml(data.time || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }));
  const device = escapeHtml(data.device || "Web Browser (Chrome/Vite)");
  const ip = escapeHtml(data.ip || "127.0.0.1 (Localhost)");

  const contentHtml = `
    <div class="greeting">Hello, ${name}!</div>
    <p class="message-text">We detected a new sign-in to your <strong>BookNexus</strong> account. If this was you, no action is needed.</p>
    <div class="card">
      <div class="row"><span class="row-label">Account</span><span class="row-value">${email}</span></div>
      <div class="row"><span class="row-label">Sign-in Time</span><span class="row-value">${time}</span></div>
      <div class="row"><span class="row-label">Device / Client</span><span class="row-value">${device}</span></div>
      <div class="row"><span class="row-label">Network Location</span><span class="row-value">${ip}</span></div>
    </div>
    <div class="alert-box alert-info">
      🛡️ <strong>Security Notice:</strong> If you did not sign in recently, please notify the library circulation desk or reset your credentials immediately.
    </div>
  `;
  const html = baseEmailLayout({
    title: "Security Notice: Successful Sign-In to BookNexus",
    previewText: `New sign-in detected on your BookNexus account (${data.email || ""})`,
    badgeText: "Security Notice",
    badgeColor: "#46282A",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: "[BookNexus] Security Alert: Successful Sign-In", html, text: stripHtmlToText(html) };
};

const signOutEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const time = escapeHtml(data.time || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
  const device = escapeHtml(data.device || "Web Browser");

  const contentHtml = `
    <div class="greeting">Signed Out of BookNexus</div>
    <p class="message-text">Hello ${name}, your session has been safely logged out.</p>
    <div class="card">
      <div class="row"><span class="row-label">Sign-Out Time</span><span class="row-value">${time}</span></div>
      <div class="row"><span class="row-label">Device</span><span class="row-value">${device}</span></div>
    </div>
    <p class="message-text" style="font-size:13px;color:#71717a;">If this wasn't you, sign back in immediately to review your account activity.</p>
  `;
  const html = baseEmailLayout({
    title: "Session Signed Out",
    previewText: "Your BookNexus session was signed out.",
    badgeText: "Security Notice",
    badgeColor: "#46282A",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: "[BookNexus] Security Notice: Signed Out", html, text: stripHtmlToText(html) };
};

const securityAlertEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const alertType = escapeHtml(data.alertType || "Security Alert");
  const description = escapeHtml(data.description || "An important change or unverified activity was observed on your account.");
  const time = escapeHtml(data.time || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));

  const contentHtml = `
    <div class="greeting">Important Security Alert: ${name}</div>
    <p class="message-text">${description}</p>
    <div class="card">
      <div class="row"><span class="row-label">Alert Type</span><span class="row-value">${alertType}</span></div>
      <div class="row"><span class="row-label">Recorded At</span><span class="row-value">${time}</span></div>
      ${data.details ? `<div class="row"><span class="row-label">Details</span><span class="row-value">${escapeHtml(data.details)}</span></div>` : ""}
    </div>
    <div class="alert-box alert-warning">
      ⚠️ <strong>Account Protection:</strong> This is a critical security notice and cannot be disabled under notification preferences.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Security Alert: ${data.alertType || "Account Notice"}`,
    previewText: `Security alert for your BookNexus account: ${data.alertType || ""}`,
    badgeText: "Security Alert",
    badgeColor: "#DC2626",
    contentHtml,
    actionButton: { label: "Review Account Security", url: `${data.appUrl || "http://localhost:3000"}/#profile` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Security Alert: ${data.alertType || "Account Activity"}`, html, text: stripHtmlToText(html) };
};

const profileUpdatedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const changeSummary = escapeHtml(data.changeSummary || "Your profile details or email preferences were updated.");
  const time = escapeHtml(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));

  const contentHtml = `
    <div class="greeting">Profile Updated, ${name}</div>
    <p class="message-text">This is a confirmation that your BookNexus profile or notification preferences were successfully updated.</p>
    <div class="card">
      <div class="row"><span class="row-label">Updated Details</span><span class="row-value">${changeSummary}</span></div>
      <div class="row"><span class="row-label">Timestamp</span><span class="row-value">${time}</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: "Profile & Preferences Updated",
    previewText: "Your BookNexus profile details or preferences were updated.",
    badgeText: "Profile Notice",
    badgeColor: "#46282A",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: "[BookNexus] Profile & Notification Settings Updated", html, text: stripHtmlToText(html) };
};

// ---------------------------------------------------------------------------
// 2. BORROWING & RENTAL EVENTS
// ---------------------------------------------------------------------------

const borrowRequestSubmittedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const author = escapeHtml(data.author || "Department Author");
  const rentalId = escapeHtml(data.rentalId || "REQ-" + Date.now().toString(16).toUpperCase());

  const contentHtml = `
    <div class="greeting">Borrow Request Submitted!</div>
    <p class="message-text">Hello ${name}, your request to borrow <strong>"${bookTitle}"</strong> has been logged in the campus library queue.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Author</span><span class="row-value">${author}</span></div>
      <div class="row"><span class="row-label">Request Ref</span><span class="row-value">${rentalId}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value" style="color:#D97706;">Pending Review</span></div>
    </div>
    <div class="alert-box alert-info">
      📋 <strong>Next Step:</strong> The library desk or book lender will review your request. You will receive an approval email with your pickup OTP once confirmed.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Borrow Request Submitted: ${data.bookTitle}`,
    previewText: `Your request to borrow "${data.bookTitle}" has been submitted for review.`,
    badgeText: "Request Submitted",
    badgeColor: "#D97706",
    contentHtml,
    actionButton: { label: "Track Borrow Status", url: `${data.appUrl || "http://localhost:3000"}/#rentals` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Borrow Request Submitted: "${data.bookTitle}"`, html, text: stripHtmlToText(html) };
};

const borrowRequestPendingEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const rentalId = escapeHtml(data.rentalId || "");

  const contentHtml = `
    <div class="greeting">Request Under Review</div>
    <p class="message-text">Hello ${name}, your borrow request for <strong>"${bookTitle}"</strong> is currently pending at the circulation desk.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      ${rentalId ? `<div class="row"><span class="row-label">Reference</span><span class="row-value">${rentalId}</span></div>` : ""}
      <div class="row"><span class="row-label">Expected Review</span><span class="row-value">Within 2 to 4 campus hours</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Request Pending Review: ${data.bookTitle}`,
    previewText: `Your request for "${data.bookTitle}" is currently under review.`,
    badgeText: "Pending Review",
    badgeColor: "#D97706",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Pending Review: Request for "${data.bookTitle}"`, html, text: stripHtmlToText(html) };
};

const borrowRequestApprovedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const author = escapeHtml(data.author || "Department Author");
  const otp = escapeHtml(data.pickupOtp || "849201");
  const location = escapeHtml(data.pickupLocation || "Main Library Circulation Desk (Counter #2)");
  const dueDate = escapeHtml(data.dueDate ? new Date(data.dueDate).toLocaleDateString("en-IN", { dateStyle: "full" }) : "14 Days from Pickup");

  const contentHtml = `
    <div class="greeting">Great News, ${name}!</div>
    <p class="message-text">Your request to borrow <strong>"${bookTitle}"</strong> has been approved. The physical copy is set aside for you at the library desk.</p>
    
    <div class="otp-display">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #92400E; letter-spacing: 1px;">Your Handover Pickup OTP</div>
      <div class="otp-code">${otp}</div>
      <div style="font-size: 12px; color: #78350F;">Show this code to the librarian or book lender to verify checkout</div>
    </div>

    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Author</span><span class="row-value">${author}</span></div>
      <div class="row"><span class="row-label">Pickup Location</span><span class="row-value">${location}</span></div>
      <div class="row"><span class="row-label">Expected Return Due Date</span><span class="row-value">${dueDate}</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Borrow Request Approved: ${data.bookTitle}`,
    previewText: `Your book is ready for pickup! Pickup OTP code: ${data.pickupOtp || ""}`,
    badgeText: "Request Approved",
    badgeColor: "#059669",
    contentHtml,
    actionButton: { label: "View Pickup Details", url: `${data.appUrl || "http://localhost:3000"}/#rentals` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Approved: Request for "${data.bookTitle}" Ready for Pickup`, html, text: stripHtmlToText(html) };
};

const borrowRequestRejectedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const reason = escapeHtml(data.reason || "Book reserved for department curriculum or out of circulation.");

  const contentHtml = `
    <div class="greeting">Borrow Request Update: ${name}</div>
    <p class="message-text">We regret to inform you that your request to borrow <strong>"${bookTitle}"</strong> could not be fulfilled at this time.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Decision</span><span class="row-value" style="color:#DC2626;">Not Approved</span></div>
      <div class="row"><span class="row-label">Reason Provided</span><span class="row-value">${reason}</span></div>
    </div>
    <div class="alert-box alert-info">
      💡 <strong>Alternative Copies:</strong> You can browse other peer listings for "${bookTitle}" or set a reserve alert when a copy returns.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Borrow Request Not Approved: ${data.bookTitle}`,
    previewText: `Update on your request for "${data.bookTitle}"`,
    badgeText: "Request Closed",
    badgeColor: "#DC2626",
    contentHtml,
    actionButton: { label: "Search Catalog for Alternatives", url: `${data.appUrl || "http://localhost:3000"}/#browse` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Notice: Request for "${data.bookTitle}" Update`, html, text: stripHtmlToText(html) };
};

const borrowRequestCancelledEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");

  const contentHtml = `
    <div class="greeting">Request Cancelled</div>
    <p class="message-text">Hello ${name}, your borrow request for <strong>"${bookTitle}"</strong> has been cancelled as requested.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value">Cancelled</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Borrow Request Cancelled: ${data.bookTitle}`,
    previewText: `Your request for "${data.bookTitle}" was cancelled.`,
    badgeText: "Cancelled",
    badgeColor: "#786C6C",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Cancelled: Borrow Request for "${data.bookTitle}"`, html, text: stripHtmlToText(html) };
};

const borrowStartedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const rentalId = escapeHtml(data.rentalId || "");
  const dueDate = escapeHtml(data.dueDate ? new Date(data.dueDate).toLocaleDateString("en-IN", { dateStyle: "full" }) : "In 14 Days");

  const contentHtml = `
    <div class="greeting">Handover Confirmed, ${name}!</div>
    <p class="message-text">Your checkout for <strong>"${bookTitle}"</strong> has been successfully verified and logged. Your loan period is now officially active.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      ${rentalId ? `<div class="row"><span class="row-label">Circulation ID</span><span class="row-value">${rentalId}</span></div>` : ""}
      <div class="row"><span class="row-label">Active Since</span><span class="row-value">${escapeHtml(new Date().toLocaleDateString("en-IN"))}</span></div>
      <div class="row"><span class="row-label">Return Due Date</span><span class="row-value" style="color:#059669;">${dueDate}</span></div>
    </div>
    <div class="alert-box alert-success">
      📖 Please take good care of the physical book. Return it to the circulation desk by <strong>${dueDate}</strong> to avoid late fines.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Book Handover Confirmed: ${data.bookTitle}`,
    previewText: `Your loan for "${data.bookTitle}" is now active. Due date: ${dueDate}`,
    badgeText: "Loan Active",
    badgeColor: "#059669",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Handover Confirmed: You Have Received "${data.bookTitle}"`, html, text: stripHtmlToText(html) };
};

const rentalConfirmationEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const author = escapeHtml(data.author || "Author");
  const rentalPrice = escapeHtml(data.price !== undefined ? "₹" + data.price : "₹0");
  const rentalId = escapeHtml(data.rentalId || "");

  const contentHtml = `
    <div class="greeting">Rental Order Confirmed, ${name}!</div>
    <p class="message-text">Your student rental order for <strong>"${bookTitle}"</strong> has been confirmed.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Author</span><span class="row-value">${author}</span></div>
      ${rentalId ? `<div class="row"><span class="row-label">Rental Ref</span><span class="row-value">${rentalId}</span></div>` : ""}
      <div class="row"><span class="row-label">Rental Fee</span><span class="row-value">${rentalPrice}</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Rental Confirmed: ${data.bookTitle}`,
    previewText: `Your rental order for "${data.bookTitle}" has been placed.`,
    badgeText: "Rental Confirmed",
    badgeColor: "#059669",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Order & Rental Confirmed: ${data.bookTitle}`, html, text: stripHtmlToText(html) };
};

const rentalStartedEmail = (data = {}) => {
  return borrowStartedEmail(data);
};

const dueDateReminderEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const daysLeft = data.daysLeft !== undefined ? Number(data.daysLeft) : 2;
  const dueDate = escapeHtml(data.dueDate ? new Date(data.dueDate).toLocaleDateString("en-IN", { dateStyle: "full" }) : "Upcoming");
  const urgencyText = daysLeft <= 0 ? "is DUE TODAY" : daysLeft === 1 ? "is due TOMORROW" : `is due in ${daysLeft} days`;

  const contentHtml = `
    <div class="greeting">Friendly Due-Date Reminder, ${name}</div>
    <p class="message-text">Your borrowed book <strong>"${bookTitle}"</strong> ${urgencyText} (${dueDate}).</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Return Due Date</span><span class="row-value" style="color:#D97706;">${dueDate}</span></div>
      <div class="row"><span class="row-label">Time Remaining</span><span class="row-value">${urgencyText}</span></div>
      <div class="row"><span class="row-label">Return Desk</span><span class="row-value">MCE Main Library Circulation Desk</span></div>
    </div>
    <div class="alert-box alert-warning">
      ⏰ Returning on time ensures that other engineering students can access necessary semester study materials and keeps your fine balance at ₹0.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Due Date Reminder: ${data.bookTitle}`,
    previewText: `Reminder: "${data.bookTitle}" ${urgencyText}.`,
    badgeText: "Due Date Reminder",
    badgeColor: "#D97706",
    contentHtml,
    actionButton: { label: "View Loan Details", url: `${data.appUrl || "http://localhost:3000"}/#rentals` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Reminder: "${data.bookTitle}" ${urgencyText}`, html, text: stripHtmlToText(html) };
};

const overdueNoticeEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const daysOverdue = escapeHtml(data.daysOverdue !== undefined ? data.daysOverdue : 3);
  const finePerDay = escapeHtml(data.finePerDay !== undefined ? data.finePerDay : 10);
  const totalPenalty = escapeHtml(data.totalPenalty !== undefined ? data.totalPenalty : (Number(daysOverdue) * Number(finePerDay)));
  const dueDate = escapeHtml(data.dueDate ? new Date(data.dueDate).toLocaleDateString("en-IN", { dateStyle: "full" }) : "Past Due");

  const contentHtml = `
    <div class="greeting" style="color:#DC2626;">Urgent Overdue Notice: ${name}</div>
    <p class="message-text">Our circulation records indicate that <strong>"${bookTitle}"</strong> has exceeded its loan period and has not yet been checked in.</p>
    <div class="card" style="border-left: 4px solid #DC2626;">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Original Due Date</span><span class="row-value">${dueDate}</span></div>
      <div class="row"><span class="row-label">Days Overdue</span><span class="row-value" style="color:#DC2626;">${daysOverdue} days late</span></div>
      <div class="row"><span class="row-label">Overdue Fine Rate</span><span class="row-value">₹${finePerDay} / day</span></div>
      <div class="row"><span class="row-label">Accrued Penalty</span><span class="row-value" style="color:#DC2626; font-size:16px;">₹${totalPenalty}</span></div>
    </div>
    <div class="alert-box alert-warning">
      🚨 Please return the book to the library circulation desk immediately to stop additional fine accumulation.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Urgent Overdue Notice: ${data.bookTitle}`,
    previewText: `Your book "${data.bookTitle}" is overdue. Current penalty: ₹${totalPenalty}.`,
    badgeText: "Overdue Notice",
    badgeColor: "#DC2626",
    contentHtml,
    actionButton: { label: "Return Book to Desk", url: `${data.appUrl || "http://localhost:3000"}/#rentals` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Urgent Overdue Notice: "${data.bookTitle}" (Fine Accruing)`, html, text: stripHtmlToText(html) };
};

const returnRequestedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");

  const contentHtml = `
    <div class="greeting">Return Requested, ${name}</div>
    <p class="message-text">A return check-in request for <strong>"${bookTitle}"</strong> has been logged. Please bring the physical book to the designated desk or meet the lender for handover.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value">Awaiting Physical Inspection</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Return Requested: ${data.bookTitle}`,
    previewText: `Return check-in initiated for "${data.bookTitle}".`,
    badgeText: "Return In Progress",
    badgeColor: "#D97706",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Return Initiated: "${data.bookTitle}"`, html, text: stripHtmlToText(html) };
};

const returnConfirmedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const rentalId = escapeHtml(data.rentalId || "");
  const returnDate = escapeHtml(new Date().toLocaleDateString("en-IN", { dateStyle: "full" }));

  const contentHtml = `
    <div class="greeting">Book Return Confirmed!</div>
    <p class="message-text">Hello ${name}, your return of <strong>"${bookTitle}"</strong> has been inspected, approved, and recorded in the library ledger.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      ${rentalId ? `<div class="row"><span class="row-label">Rental Ref</span><span class="row-value">${rentalId}</span></div>` : ""}
      <div class="row"><span class="row-label">Return Date</span><span class="row-value">${returnDate}</span></div>
      <div class="row"><span class="row-label">Condition</span><span class="row-value" style="color:#059669;">Verified Clean / Good</span></div>
    </div>
    <div class="alert-box alert-success">
      ✅ Your circulation record has been cleared for this book. Thank you for returning it in good condition!
    </div>
  `;
  const html = baseEmailLayout({
    title: `Return Confirmed: ${data.bookTitle}`,
    previewText: `Your return of "${data.bookTitle}" has been verified and cleared.`,
    badgeText: "Returned & Cleared",
    badgeColor: "#059669",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Return Confirmed: "${data.bookTitle}" Checked In`, html, text: stripHtmlToText(html) };
};

const rentalCompletedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const refundText = data.depositRefunded ? `₹${escapeHtml(data.depositRefunded)}` : "None";
  const txHash = escapeHtml(data.txHash || data.returnTxHash || "");

  const contentHtml = `
    <div class="greeting">Rental Cycle Completed!</div>
    <p class="message-text">Hello ${name}, the entire rental and loan cycle for <strong>"${bookTitle}"</strong> is now 100% completed.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Title</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Final Status</span><span class="row-value" style="color:#059669;">Completed &amp; Closed</span></div>
      ${data.depositRefunded ? `<div class="row"><span class="row-label">Security Deposit Released</span><span class="row-value">${refundText}</span></div>` : ""}
      ${txHash ? `<div class="row"><span class="row-label">Ledger Audit Hash</span><span class="row-value" style="font-family:monospace;font-size:11px;">${txHash.slice(0, 18)}...</span></div>` : ""}
    </div>
  `;
  const html = baseEmailLayout({
    title: `Rental Completed: ${data.bookTitle}`,
    previewText: `Rental cycle completed and cleared for "${data.bookTitle}".`,
    badgeText: "Cycle Completed",
    badgeColor: "#059669",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Rental Completed & Cleared: "${data.bookTitle}"`, html, text: stripHtmlToText(html) };
};

// ---------------------------------------------------------------------------
// 3. PAYMENT, REFUND & TRANSACTION EVENTS
// ---------------------------------------------------------------------------

const paymentInitiatedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const amount = escapeHtml(data.amount !== undefined ? "₹" + data.amount : "₹0");
  const purpose = escapeHtml(data.purpose || data.type || "Library Service Fee");
  const txnRef = escapeHtml(data.transactionRef || data.id || "TXN-INIT-" + Date.now().toString(16).toUpperCase());

  const contentHtml = `
    <div class="greeting">Payment Initiated, ${name}</div>
    <p class="message-text">A payment for <strong>${purpose}</strong> has been initiated in your BookNexus account.</p>
    <div class="card">
      <div class="row"><span class="row-label">Transaction Ref</span><span class="row-value font-mono">${txnRef}</span></div>
      <div class="row"><span class="row-label">Purpose</span><span class="row-value">${purpose}</span></div>
      <div class="row"><span class="row-label">Amount</span><span class="row-value">${amount}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value" style="color:#D97706;">Initiated (Pending Settlement)</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Payment Initiated: ${txnRef}`,
    previewText: `Payment initiated for ${purpose}: ${amount}`,
    badgeText: "Payment Initiated",
    badgeColor: "#D97706",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Payment Initiated: Ref ${txnRef} (${amount})`, html, text: stripHtmlToText(html) };
};

const paymentPendingEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const amount = escapeHtml(data.amount !== undefined ? "₹" + data.amount : "₹0");
  const purpose = escapeHtml(data.purpose || data.type || "Library Fine / Rental Deposit");
  const txnRef = escapeHtml(data.transactionRef || "");

  const contentHtml = `
    <div class="greeting">Pending Payment Settlement, ${name}</div>
    <p class="message-text">We are awaiting confirmation for your payment regarding <strong>${purpose}</strong>.</p>
    <div class="card">
      ${txnRef ? `<div class="row"><span class="row-label">Reference</span><span class="row-value font-mono">${txnRef}</span></div>` : ""}
      <div class="row"><span class="row-label">Amount Due</span><span class="row-value" style="color:#D97706;">${amount}</span></div>
      <div class="row"><span class="row-label">Settlement Mode</span><span class="row-value">Campus Desk UPI / Cash</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: "Pending Payment Settlement",
    previewText: `Payment pending for ${purpose}: ${amount}`,
    badgeText: "Pending Payment",
    badgeColor: "#D97706",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Payment Pending: ${amount} for ${purpose}`, html, text: stripHtmlToText(html) };
};

const paymentSuccessEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const amount = escapeHtml(data.amount !== undefined ? "₹" + data.amount : "₹0");
  const purpose = escapeHtml(data.purpose || data.type || "Library Fine Settled");
  const txnRef = escapeHtml(data.transactionRef || "TXN-" + Date.now().toString(16).toUpperCase());
  const date = escapeHtml(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" }));

  const contentHtml = `
    <div class="greeting">Payment Successful, ${name}!</div>
    <p class="message-text">Your payment of <strong>${amount}</strong> for <strong>${purpose}</strong> has been independently verified and settled.</p>
    <div class="card">
      <div class="row"><span class="row-label">Receipt Reference</span><span class="row-value font-mono">${txnRef}</span></div>
      <div class="row"><span class="row-label">Item / Purpose</span><span class="row-value">${purpose}</span></div>
      <div class="row"><span class="row-label">Amount Paid</span><span class="row-value" style="color:#059669; font-size:16px;">${amount}</span></div>
      <div class="row"><span class="row-label">Payment Date</span><span class="row-value">${date}</span></div>
      <div class="row"><span class="row-label">Verification</span><span class="row-value" style="color:#059669;">Verified by Campus Gateway</span></div>
    </div>
    <div class="alert-box alert-success">
      🧾 Your account ledger has been updated and an official university transaction receipt is generated below.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Payment Successful: ${txnRef}`,
    previewText: `Payment verified: ${amount} for ${purpose}. Ref: ${txnRef}`,
    badgeText: "Payment Verified",
    badgeColor: "#059669",
    contentHtml,
    actionButton: { label: "View Official Receipt", url: `${data.appUrl || "http://localhost:3000"}/#transactions` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Payment Verified & Receipt: ${txnRef} (${amount})`, html, text: stripHtmlToText(html) };
};

const paymentFailedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const amount = escapeHtml(data.amount !== undefined ? "₹" + data.amount : "₹0");
  const reason = escapeHtml(data.reason || "Payment timed out or transaction cancelled by issuer.");

  const contentHtml = `
    <div class="greeting" style="color:#DC2626;">Payment Could Not Be Completed</div>
    <p class="message-text">Hello ${name}, your transaction attempt of <strong>${amount}</strong> was not completed.</p>
    <div class="card">
      <div class="row"><span class="row-label">Amount</span><span class="row-value">${amount}</span></div>
      <div class="row"><span class="row-label">Failure Reason</span><span class="row-value">${reason}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value" style="color:#DC2626;">Failed</span></div>
    </div>
    <div class="alert-box alert-warning">
      💡 No amount was debited from your university balance. You can retry the payment or settle at the campus desk.
    </div>
  `;
  const html = baseEmailLayout({
    title: "Payment Transaction Failed",
    previewText: `Payment of ${amount} could not be completed: ${reason}`,
    badgeText: "Transaction Failed",
    badgeColor: "#DC2626",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Payment Failed: ${amount}`, html, text: stripHtmlToText(html) };
};

const refundInitiatedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const amount = escapeHtml(data.amount !== undefined ? "₹" + data.amount : "₹0");
  const purpose = escapeHtml(data.purpose || "Security Deposit Return");

  const contentHtml = `
    <div class="greeting">Refund Initiated, ${name}</div>
    <p class="message-text">A refund of <strong>${amount}</strong> for <strong>${purpose}</strong> has been initiated to your account.</p>
    <div class="card">
      <div class="row"><span class="row-label">Purpose</span><span class="row-value">${purpose}</span></div>
      <div class="row"><span class="row-label">Refund Amount</span><span class="row-value" style="color:#059669;">${amount}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value">Processing via Campus Desk</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Refund Initiated: ${amount}`,
    previewText: `Refund initiated for ${purpose}: ${amount}`,
    badgeText: "Refund Processing",
    badgeColor: "#D97706",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Refund Initiated: ${amount} (${purpose})`, html, text: stripHtmlToText(html) };
};

const refundCompletedEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const amount = escapeHtml(data.amount !== undefined ? "₹" + data.amount : "₹0");
  const txnRef = escapeHtml(data.transactionRef || "RFD-" + Date.now().toString(16).toUpperCase());

  const contentHtml = `
    <div class="greeting">Refund Completed, ${name}!</div>
    <p class="message-text">Your refund of <strong>${amount}</strong> has been successfully credited and finalized.</p>
    <div class="card">
      <div class="row"><span class="row-label">Refund Ref</span><span class="row-value font-mono">${txnRef}</span></div>
      <div class="row"><span class="row-label">Amount Refunded</span><span class="row-value" style="color:#059669; font-size:16px;">${amount}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value" style="color:#059669;">Completed</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Refund Completed: ${txnRef}`,
    previewText: `Refund of ${amount} completed. Ref: ${txnRef}`,
    badgeText: "Refund Completed",
    badgeColor: "#059669",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Refund Completed: ${amount} (Ref: ${txnRef})`, html, text: stripHtmlToText(html) };
};

const transactionReceiptEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const txnRef = escapeHtml(data.transactionRef || data.txnRef || data.receiptNumber || data.id || "TXN-" + Date.now());
  const amount = escapeHtml(data.amount !== undefined ? "₹" + data.amount : "₹0");
  const type = escapeHtml(data.type || data.purpose || "Circulation Transaction");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Materials");
  const date = escapeHtml(data.date || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }));
  const method = escapeHtml(data.paymentMethod || "Campus Desk UPI");

  const contentHtml = `
    <div class="greeting">Official Transaction Receipt</div>
    <p class="message-text">Hello ${name}, here is your official BookNexus transaction receipt for your records.</p>
    <div class="card" style="border: 1px solid #46282A; background-color:#FFFFFF;">
      <div style="border-bottom: 2px solid #46282A; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between;">
        <span style="font-weight: 800; font-size: 15px; color: #46282A;">RECEIPT #${txnRef}</span>
        <span style="color: #059669; font-weight: 700;">PAID</span>
      </div>
      <div class="row"><span class="row-label">Student Name</span><span class="row-value">${name}</span></div>
      <div class="row"><span class="row-label">Transaction Type</span><span class="row-value">${type}</span></div>
      <div class="row"><span class="row-label">Associated Book</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Payment Mode</span><span class="row-value">${method}</span></div>
      <div class="row"><span class="row-label">Timestamp</span><span class="row-value">${date}</span></div>
      <div class="row" style="border-top: 2px solid #46282A; margin-top: 10px; padding-top: 12px;">
        <span class="row-label" style="font-size:16px; color:#1F1919; font-weight:800;">Total Amount</span>
        <span class="row-value" style="font-size:18px; color:#46282A; font-weight:900;">${amount}</span>
      </div>
    </div>
    <div class="alert-box alert-info">
      🏛️ Issued by BookNexus Library Management System, Malnad College of Engineering. Valid for institutional fee reconciliation.
    </div>
  `;
  const html = baseEmailLayout({
    title: `Official Receipt #${txnRef}`,
    previewText: `BookNexus Official Receipt #${txnRef} for ${amount}`,
    badgeText: "Official Receipt",
    badgeColor: "#46282A",
    contentHtml,
    actionButton: { label: "View in Ledger", url: `${data.appUrl || "http://localhost:3000"}/#transactions` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Official Transaction Receipt: #${txnRef}: ${amount}`, html, text: stripHtmlToText(html) };
};

// ---------------------------------------------------------------------------
// 4. REMINDERS & ADMINISTRATIVE
// ---------------------------------------------------------------------------

const pendingApprovalReminderEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Librarian / Owner");
  const bookTitle = escapeHtml(data.bookTitle || "Academic Title");
  const requester = escapeHtml(data.requesterName || "A student");

  const contentHtml = `
    <div class="greeting">Action Required: Pending Request Reminder</div>
    <p class="message-text">Hello ${name}, a borrow request for <strong>"${bookTitle}"</strong> by <strong>${requester}</strong> is still waiting for your approval.</p>
    <div class="card">
      <div class="row"><span class="row-label">Book Requested</span><span class="row-value">${bookTitle}</span></div>
      <div class="row"><span class="row-label">Requested By</span><span class="row-value">${requester}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value" style="color:#D97706;">Awaiting Approval</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: `Pending Request Reminder: ${data.bookTitle}`,
    previewText: `Reminder: Borrow request for "${data.bookTitle}" is awaiting your review.`,
    badgeText: "Pending Action",
    badgeColor: "#D97706",
    contentHtml,
    actionButton: { label: "Open Circulation Desk", url: `${data.appUrl || "http://localhost:3000"}/#librarianDesk` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Action Required: Borrow Request for "${data.bookTitle}" Awaiting Review`, html, text: stripHtmlToText(html) };
};

const pendingPaymentReminderEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const amount = escapeHtml(data.amount !== undefined ? "₹" + data.amount : "₹0");
  const reason = escapeHtml(data.reason || "Library Fine / Balance Due");

  const contentHtml = `
    <div class="greeting">Pending Balance Reminder, ${name}</div>
    <p class="message-text">You have an outstanding balance of <strong>${amount}</strong> on your BookNexus library account for <strong>${reason}</strong>.</p>
    <div class="card">
      <div class="row"><span class="row-label">Outstanding Amount</span><span class="row-value" style="color:#DC2626;">${amount}</span></div>
      <div class="row"><span class="row-label">Reason</span><span class="row-value">${reason}</span></div>
      <div class="row"><span class="row-label">Payment Counter</span><span class="row-value">Library Desk / Online UPI</span></div>
    </div>
  `;
  const html = baseEmailLayout({
    title: "Pending Library Balance Reminder",
    previewText: `You have an outstanding library balance of ${amount}.`,
    badgeText: "Payment Due",
    badgeColor: "#DC2626",
    contentHtml,
    actionButton: { label: "Settle Balance", url: `${data.appUrl || "http://localhost:3000"}/#transactions` },
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Reminder: Outstanding Library Balance of ${amount}`, html, text: stripHtmlToText(html) };
};

const importantNotificationEmail = (data = {}) => {
  const name = escapeHtml(data.name || "Scholar");
  const title = escapeHtml(data.title || "University Notice");
  const message = escapeHtml(data.message || data.body || "An announcement has been published to BookNexus.");

  const contentHtml = `
    <div class="greeting">Hello, ${name}</div>
    <p class="message-text">${message}</p>
  `;
  const html = baseEmailLayout({
    title: data.title || "University Notice",
    previewText: data.message || "Important notice from BookNexus",
    badgeText: "Campus Notice",
    badgeColor: "#46282A",
    contentHtml,
    appUrl: data.appUrl,
  });
  return { subject: `[BookNexus] Notice: ${data.title || "Campus Announcement"}`, html, text: stripHtmlToText(html) };
};

// ---------------------------------------------------------------------------
// 5. BACKWARD-COMPATIBLE ADAPTERS FOR EXISTING CONTROLLERS
// ---------------------------------------------------------------------------

const bookBuyingEmail = (data) => rentalConfirmationEmail(data).html;
const pendingStatusEmail = (data) => borrowRequestPendingEmail(data).html;
const bookAcceptedEmail = (data) => borrowRequestApprovedEmail(data).html;
const successfullyReceivedEmail = (data) => borrowStartedEmail(data).html;
const penaltyEmail = (data) => overdueNoticeEmail(data).html;
const overallCompletedEmail = (data) => rentalCompletedEmail(data).html;

const otpEmail = ({ name, otp, purpose, expiryMinutes, bookTitle }) => {
  const contentHtml = `
    <div class="greeting">Verification OTP Code</div>
    <p class="message-text">Hello ${escapeHtml(name || "Scholar")}, here is your one-time verification password for <strong>${escapeHtml(purpose || "Handover Verification")}</strong>${bookTitle ? ` regarding <em>"${escapeHtml(bookTitle)}"</em>` : ""}.</p>
    <div class="otp-display">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #92400E; letter-spacing: 1px;">One-Time Password (OTP)</div>
      <div class="otp-code">${escapeHtml(otp)}</div>
      <div style="font-size: 12px; color: #78350F;">Valid for ${escapeHtml(expiryMinutes || 10)} minutes. Never share this code over phone or chat.</div>
    </div>
  `;
  return baseEmailLayout({
    title: `Your OTP Code: ${otp}`,
    previewText: `Your one-time verification code is ${otp}.`,
    badgeText: "OTP Verification",
    badgeColor: "#D97706",
    contentHtml,
  });
};

// ---------------------------------------------------------------------------
// 6. MASTER TEMPLATE DISPATCHER
// ---------------------------------------------------------------------------

const TEMPLATE_REGISTRY = {
  welcome: welcomeEmail,
  signIn: signInEmail,
  signOut: signOutEmail,
  logout: signOutEmail,
  securityAlert: securityAlertEmail,
  profileUpdated: profileUpdatedEmail,
  borrowRequestSubmitted: borrowRequestSubmittedEmail,
  borrowRequestPending: borrowRequestPendingEmail,
  borrowRequestApproved: borrowRequestApprovedEmail,
  borrowRequestRejected: borrowRequestRejectedEmail,
  borrowRequestCancelled: borrowRequestCancelledEmail,
  borrowStarted: borrowStartedEmail,
  rentalConfirmation: rentalConfirmationEmail,
  rentalStarted: rentalStartedEmail,
  dueDateReminder: dueDateReminderEmail,
  overdueNotice: overdueNoticeEmail,
  returnRequested: returnRequestedEmail,
  returnConfirmed: returnConfirmedEmail,
  rentalCompleted: rentalCompletedEmail,
  paymentInitiated: paymentInitiatedEmail,
  paymentPending: paymentPendingEmail,
  paymentSuccess: paymentSuccessEmail,
  paymentFailed: paymentFailedEmail,
  refundInitiated: refundInitiatedEmail,
  refundCompleted: refundCompletedEmail,
  transactionReceipt: transactionReceiptEmail,
  pendingApprovalReminder: pendingApprovalReminderEmail,
  pendingPaymentReminder: pendingPaymentReminderEmail,
  importantNotification: importantNotificationEmail,
};

/**
 * Renders any template by name with clean escaping, subject, html, and text fallback
 */
function renderTemplate(templateName, templateData = {}) {
  const renderer = TEMPLATE_REGISTRY[templateName];
  if (!renderer) {
    const safeMsg = escapeHtml(templateData.message || "Notification from BookNexus");
    const html = baseEmailLayout({
      title: "BookNexus Notification",
      previewText: "BookNexus notification",
      contentHtml: `<p class="message-text">${safeMsg}</p>`,
    });
    return {
      subject: templateData.subject || "BookNexus Notification",
      html,
      text: stripHtmlToText(html),
    };
  }
  return renderer(templateData);
}

module.exports = {
  escapeHtml,
  stripHtmlToText,
  baseEmailLayout,
  renderTemplate,
  renderEmailTemplate: renderTemplate,
  TEMPLATE_REGISTRY,
  // Account
  welcomeEmail,
  signInEmail,
  signOutEmail,
  securityAlertEmail,
  profileUpdatedEmail,
  // Borrowing & Rental
  borrowRequestSubmittedEmail,
  borrowRequestPendingEmail,
  borrowRequestApprovedEmail,
  borrowRequestRejectedEmail,
  borrowRequestCancelledEmail,
  borrowStartedEmail,
  rentalConfirmationEmail,
  rentalStartedEmail,
  dueDateReminderEmail,
  overdueNoticeEmail,
  returnRequestedEmail,
  returnConfirmedEmail,
  rentalCompletedEmail,
  // Payment & Receipts
  paymentInitiatedEmail,
  paymentPendingEmail,
  paymentSuccessEmail,
  paymentFailedEmail,
  refundInitiatedEmail,
  refundCompletedEmail,
  transactionReceiptEmail,
  // Reminders
  pendingApprovalReminderEmail,
  pendingPaymentReminderEmail,
  importantNotificationEmail,
  // Backward compatibility
  bookBuyingEmail,
  pendingStatusEmail,
  bookAcceptedEmail,
  otpEmail,
  successfullyReceivedEmail,
  penaltyEmail,
  overallCompletedEmail,
};