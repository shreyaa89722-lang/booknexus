# BookNexus — Academic Textbook Circulation & Peer-to-Peer Rental Platform

BookNexus is an academic textbook circulation and rental management platform designed for colleges and universities. It features Google Identity authentication, catalog browsing, peer-to-peer textbook rentals, counter pickup verification with 6-digit OTP codes, and a transactional email notification system powered by **Resend** and **MongoDB Outbox**.

---

## 🌟 Key Features

- **Google OAuth 2.0 & USN Student Authentication**: Seamless sign-in with Google Identity Services or university student USN.
- **580+ Academic Textbook Catalog**: Instant search across titles, authors, genres, and course subjects.
- **Zero-Fee Campus Circulation & Peer-to-Peer Rentals**: Request books, track loans, and manage peer-to-peer textbook listings.
- **Counter Pickup OTP Code Verification**: Secure 6-digit verification code system prevents unauthorized textbook collections.
- **Complete Transactional Email Notification System**:
  - Powered by **Resend SDK** with fallback simulated engine.
  - **Durable MongoDB Outbox**: Guaranteed delivery with atomic job claiming.
  - **Deterministic Idempotency**: SHA-256 event fingerprinting prevents duplicate notifications.
  - **23 Canonical HTML Email Templates**: Branded in BookNexus visual identity (`#46282A` Rosewood, `#D97706` Amber, `#FAF7F2` Cream).
  - **Student Notification Preferences**: Granular control over rental updates, reminders, and reading recommendations.
  - **Admin Outbox Activity Dashboard**: Real-time delivery telemetry, filters, and manual retry controls.
  - **Automated Scheduler**: Daily sweeps for upcoming due dates (48h/24h), late penalties, and pending approvals.

---

## 🚀 Quick Start

### 1. Configure Backend Environment
```bash
cd backend
cp .env.example .env
```
Ensure `backend/.env` has your database and Resend credentials configured. (If `RESEND_API_KEY` is omitted, the system runs safely in simulation mode).

### 2. Start Backend & Email Worker
```bash
cd backend
npm install
node server.js
```

### 3. Start Frontend Web Interface
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the automated test suite covering all 10 dimensions of the email system:
```bash
cd backend
node testEmailSystem.js
```

Verify real email delivery to your inbox:
```bash
cd backend
node verifyRealDelivery.js your-email@example.com
```

---

## 📚 Documentation Directory

- [SETUP.md](SETUP.md) — Comprehensive installation and DNS domain verification guide.
- [FEATURES.md](FEATURES.md) — Detailed catalog of all 23 email event templates and circulation features.
- [ARCH.md](ARCH.md) — System architecture, Outbox pattern, and workflow diagrams.
- [API.md](API.md) — Complete REST API reference for authentication, circulation, and email endpoints.
- [TESTING.md](TESTING.md) — Quality assurance procedures and test coverage matrices.
- [INTEGRATIONS.md](INTEGRATIONS.md) — Resend, Google OAuth, MongoDB, and smart contract integrations.