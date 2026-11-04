# BookNexus — Features & Capabilities

Comprehensive catalog of features provided by the BookNexus academic textbook circulation and transactional email notification platform.

---

## 1. Professional Transactional Email Engine

### Architecture
- **Resend Node.js SDK**: First-class integration with Resend transactional email API.
- **MongoDB Outbox Pattern**: Decoupled, durable queueing where emails are written to the database in the same transaction as business events.
- **Background Worker**: Atomic job claiming (`findOneAndUpdate` with `status: 'processing'`), exponential backoff retries (1m, 2m, 4m, 8m), and auto-recovery of stalled worker jobs.
- **Deterministic Idempotency**: SHA-256 event fingerprinting prevents duplicate emails even under repeated frontend initializations or network retries.
- **Fail-Safe Isolation**: An email delivery failure or rate-limit never breaks, halts, or rolls back a completed rental or verified payment.

---

## 2. Supported Email Event Workflows (23 Canonical Templates)

### A. Account Security & Identity Events
1. **Welcome Email**: Sent upon registration, detailing college membership privileges and catalog access.
2. **Security Sign-In Notice**: Sent upon successful authentication (Google OAuth or USN login) with device snapshot, timestamp, and IP.
3. **Account Security Alert**: Instant notification for password modifications, suspicious sign-in attempts, or session revocation.
4. **Profile & Preferences Updated**: Confirmation of reader profile and notification channel updates.

### B. Borrowing & Circulation Events
5. **Borrow Request Submitted**: Confirmation to student with request details and librarian queue status.
6. **Borrow Request Approved**: Notifies student with counter pickup instructions and **6-digit Counter Pickup OTP**.
7. **Borrow Request Rejected**: Polite notification with librarian reason and catalog alternatives.
8. **Borrow Request Cancelled**: Confirmation of user cancellation before fulfillment.
9. **Book Handover Confirmed (Rental Started)**: Sent upon successful counter OTP verification and physical book handover.
10. **Due-Date Reminder (Advance Notice)**: Automated advance notices (48h and 24h prior to loan expiration).
11. **Overdue Book Notice**: Triggered when a loan lapses, detailing days overdue, daily fine rates, and accumulated penalty.
12. **Book Return Requested**: Acknowledgement of return initiation.
13. **Book Return Confirmed**: Notification that book has been inspected, accepted, and cleared from circulation records.
14. **Rental Cycle Completed**: Overall completion notice with deposit refund status and ledger audit transaction hash.

### C. Financial & Escrow Events (Server-Side Verified)
15. **Payment Initiated**: Initial record of campus counter or digital payment attempt.
16. **Payment Pending Verification**: Sent when a deposit or fine settlement is awaiting desk staff confirmation.
17. **Payment Success**: Transmitted **only** after independent server-side verification by library desk or gateway webhook.
18. **Payment Failed**: Alert regarding payment decline with re-try instructions.
19. **Refund Initiated**: Notice of security deposit refund processing.
20. **Refund Completed**: Official confirmation of funds release to student UPI or bank account.
21. **Official Transaction Receipt**: Formatted, institutional fee-reconciliation receipt with unique receipt number, timestamp, amount, and line items.

### D. Administrative & Proactive Reminders
22. **Pending Approval Reminder**: Proactive notice dispatched to librarians/owners when borrow requests remain unreviewed > 24 hours.
23. **Important Campus Announcement**: Curated library alerts, operating hours, and semester book drives.

---

## 3. Trusted Recipient Resolution

- **Database-Driven Identity**: All recipients are strictly resolved via authenticated `userId` or trusted MongoDB relations.
- **Zero Frontend Email Trust**: The backend never accepts, parses, or delivers emails to user-supplied email strings from request payloads.
- **No Global Fallback**: Eliminates universal fallback recipients, preventing data cross-contamination between students.

---

## 4. User Notification Preferences System

Students can manage optional email communication categories in **Profile & Preferences**:
- **Rental & Borrowing Updates** (`rentalUpdates`)
- **Due Date & Overdue Reminders** (`dueReminders`)
- **Campus Announcements** (`announcements`)
- **Reading Recommendations** (`readingUpdates`)
- **Promotional & Book Drives** (`promotional`)

> [!IMPORTANT]
> **Non-Disableable Security & Receipts**: Account security alerts and verified payment receipts bypass optional unsubscribes for student security and institutional compliance.

---

## 5. Administrative Email Delivery Monitor

Librarians and campus administrators access the **Transactional Email Delivery Activity** panel:
- **Telemetry Counters**: Real-time stats for Total Queued, Pending, Sent, Delivered, and Failed.
- **Filterable Queue**: View emails by status (`all`, `pending`, `sent`, `delivered`, `failed`, `bounced`).
- **Telemetry Details**: Safe metadata inspection including Recipient, Event Type, Provider Message ID, Attempt Count, and Failure Reason.
- **Idempotent Retry**: One-click retry button for failed emails without duplicating the underlying business operation.
