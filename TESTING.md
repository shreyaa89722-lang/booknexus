# BookNexus — Testing & Quality Assurance Guide

Comprehensive testing procedures covering automated unit tests, integration tests, security regression tests, and live Resend delivery verification.

---

## 1. Automated Test Suite (`backend/testEmailSystem.js`)

Run the automated test suite directly via Node.js:

```bash
cd backend
node testEmailSystem.js
```

### Test Coverage Matrix (36 Automated Assertions)
1. **Template Engine & XSS Escaping**:
   - Sanitization of `<script>` tags and malicious attribute injections via `escapeHtml()`.
   - Verification of BookNexus brand colors (`#46282A`, `#D97706`, `#FAF7F2`).
   - Plain-text fallback generation matching HTML content semantics.
   - Dynamic receipt line items, currency formatting, and metadata rendering.
2. **Trusted Recipient Resolution**:
   - Resolution from MongoDB ObjectId and verified user accounts.
   - Rejection of invalid, unverified, or non-existent identifiers.
   - Elimination of universal fallback mailboxes.
3. **User Notification Preferences**:
   - Respecting user opt-outs (`rentalUpdates: false`).
   - Mandatory bypass for security notifications and official payment receipts.
4. **Idempotency & Duplicate Suppression**:
   - Deterministic SHA-256 idempotency key generation.
   - Atomic database-level duplicate suppression without throwing unhandled exceptions.
5. **Background Worker & Atomic Job Claiming**:
   - Atomic locking using `findOneAndUpdate({ status: 'pending' }, { $set: { status: 'processing' } })`.
   - Transition to `sent` with provider message ID and timestamp recording.
6. **Exponential Backoff & Retries**:
   - Re-queueing on temporary network/provider failures with increasing delays (1m, 2m, 4m, 8m).
   - Safe recording of error reasons in `lastError`.
7. **Server-Side Payment Verification**:
   - Validation that receipts cannot be queued for unverified (`pending`) transactions.
   - Verified transactions successfully queue both `payment.success` and `transaction.receipt`.
8. **Resend / Svix Webhook Verification**:
   - Validation of genuine HMAC-SHA256 signatures with valid timestamps.
   - Immediate `401 Unauthorized` rejection of forged signatures or replay attacks (>300s timestamp drift).
9. **Scheduler Reminder Sweeps**:
   - Advance due date scanning (48h/24h).
   - Overdue penalty accumulation.
   - Stale borrow request review reminders (>24h).

---

## 2. Real Delivery Verification (`backend/verifyRealDelivery.js`)

To verify real-world email delivery using a configured Resend account and verified domain:

```bash
cd backend
node verifyRealDelivery.js your-email@domain.com
```

### Evaluation Criteria:
- **Simulation Mode (When `RESEND_API_KEY` is empty)**:
  - Prints: `✅ SIMULATION SUCCESSFUL`
  - Output contains simulated message ID: `sim-...`
  - Zero runtime errors or broken server processes.
- **Live Mode (When `RESEND_API_KEY` is provided)**:
  - Prints: `🎉 LIVE DELIVERY SUCCESSFUL!`
  - Output contains Resend Message ID: `msg_...` or `re_...`
  - Check your physical inbox/spam folder for the styled BookNexus email.

---

## 3. End-to-End Google Auth & Persistence Regression

Verify that Google Sign-In, token storage, and account switching maintain 100% operational integrity:

```bash
node testGoogleAuthFullSuite.js
```

Expected result:
```
📊 TEST SUMMARY:
Passed: 14 / 14
Page Errors: 0
Console Errors: 0
🎉 100% SUCCESS: ZERO ERRORS! ALL GOOGLE AUTH REQUIREMENTS VERIFIED!
```
