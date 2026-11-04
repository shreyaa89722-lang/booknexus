# BookNexus — Setup & Installation Guide

Complete configuration and deployment guide for the BookNexus platform, including the professional transactional email notification system powered by Resend and MongoDB Outbox.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/bookhive`) or MongoDB Atlas cluster URI
- **Resend Account**: Required for real email delivery ([https://resend.com](https://resend.com))
- **Google Cloud Console**: OAuth 2.0 Web Client for Google Sign-In

---

## 2. Environment Configuration

### Backend Setup

Navigate to the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and configure the following variables:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/bookhive
ATLAS_MONGO_URI=
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000

# Google Identity Services
GOOGLE_CLIENT_ID=678657142900-oibcoi8ind88u1l11e6mgk5cic8qqasm.apps.googleusercontent.com

# Resend Transactional Email Engine
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=notifications@yourdomain.com
EMAIL_FROM_NAME=BookNexus
EMAIL_REPLY_TO=support@yourdomain.com
APP_BASE_URL=http://localhost:3000
EMAIL_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Optional Legacy SMTP Fallback
EMAIL_USER=
EMAIL_APP_PASSWORD=
```

> [!NOTE]
> If `RESEND_API_KEY` is left blank, BookNexus automatically enters **Simulated Delivery Mode**. Transactional emails are logged with deterministic simulated message IDs (`sim-...`) without throwing fatal runtime errors.

---

## 3. Resend & Domain Verification

To send real transactional emails to university scholars:

1. **Create an Account**: Register at [https://resend.com](https://resend.com).
2. **Add Domain**: Under **Domains**, add your campus or platform domain (e.g., `booknexus.edu` or `notifications.yourdomain.com`).
3. **Configure DNS Records** at your domain registrar:
   - **DKIM TXT**: Name `resend._domainkey.yourdomain.com`, Value supplied by Resend dashboard.
   - **SPF TXT**: Name `@` or subdomain, Value `v=spf1 include:resend.com ~all`.
   - **MX (Inbound/Bounce)**: Name `feedback.yourdomain.com`, Value `feedback-smtp.resend.com`, Priority `10`.
4. **Obtain API Key**: Go to **API Keys** -> **Create API Key** (Permission: "Full Access" or "Sending access").
5. **Paste Key**: Set `RESEND_API_KEY=re_...` in `backend/.env`.
6. **Set Sender**: Update `EMAIL_FROM=notifications@yourdomain.com`.

---

## 4. Installing Dependencies

```bash
# Root & frontend dependencies
npm install
cd frontend && npm install && cd ..

# Backend dependencies
cd backend && npm install && cd ..
```

---

## 5. Starting the Backend, Email Worker & Scheduler

The BookNexus server boots the Express REST API, MongoDB persistent storage, background email delivery worker, and reminder sweep scheduler concurrently:

```bash
cd backend
npm run dev
# or
node server.js
```

Expected startup logs:
```
Connected to database: mongodb://127.0.0.1:27017/bookhive
[EmailWorker] 🚀 Background email worker active (polling every 5s).
[EmailScheduler] ⏰ Recurring reminder scheduler initialized (daily sweep active).
BookNexus backend running on port 5000
```

---

## 6. Starting the Frontend

In a separate terminal window:

```bash
cd frontend
npm run dev
```

The frontend web interface will be available at:
```
http://localhost:3000
```

---

## 7. Running the Automated Test Suite

BookNexus includes a comprehensive automated test suite verifying all 10 core dimensions of the email system:

```bash
cd backend
node testEmailSystem.js
```

Verify that all 36 test assertions pass:
```
============================================================
🎉 ALL TESTS COMPLETED: 36 Passed, 0 Failed
============================================================
```

---

## 8. Verifying Real Delivery

Run the delivery verification CLI tool to test your live Resend API key or simulation mode:

```bash
cd backend
node verifyRealDelivery.js your-student-email@example.edu
```

If configured with a valid `RESEND_API_KEY`, the email will be transmitted immediately and you will receive a Live Resend Message ID. If run without an API key, it validates the template rendering pipeline in simulation mode.
