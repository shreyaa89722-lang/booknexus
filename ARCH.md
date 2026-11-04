# BookNexus — System Architecture & Design

Engineering blueprint and architectural separation of concerns for the BookNexus transactional email notification system.

---

## 1. Architectural Philosophy

The email notification system is built on four core tenets:
1. **Asynchronous Durability (Outbox Pattern)**: Business mutations (loans, payments, auth) commit atomically with email events to MongoDB before any network I/O with email providers.
2. **Fail-Safe Business Isolation**: Email delivery outages, provider rate-limits, or invalid mailboxes never roll back or halt successful library loans, returns, or verified transactions.
3. **Zero-Trust Identity**: Recipients are resolved solely from authenticated server sessions and trusted MongoDB records. Frontend payloads are strictly prohibited from dictating destination email addresses.
4. **Deterministic Idempotency**: Cryptographic hashes of business events guarantee that duplicate triggers result in zero duplicate emails.

---

## 2. End-to-End Delivery Flow

```
Business Controller (e.g. rentalController, authController, paymentController)
   │
   ▼
[1] Database Operation Committed (Mongoose save / create)
   │
   ▼
[2] emailEventService (Event Trigger)
   ├── Resolve Trusted Recipient from MongoDB
   ├── Enforce User Preferences (rentalUpdates, dueReminders, etc.)
   └── Compute Deterministic Idempotency Key (SHA-256)
   │
   ▼
[3] MongoDB EmailOutbox Collection
   ├── status: "pending"
   ├── scheduledAt: now
   └── attemptCount: 0
   │
   ▼
[4] Background Worker (emailWorker)
   ├── Atomic Claim (findOneAndUpdate status: "processing")
   ├── Render HTML Template with XSS Escaping
   └── Dispatch to Resend SDK API (or Simulated fallback)
   │
   ▼
[5] Delivery Status Tracking
   ├── On Success: status = "sent", providerMessageId = id, mirror in User Notification center
   ├── On Failure: attemptCount++, backoff delay calculated, status = "pending" (or "failed" if max reached)
   └── On Resend Webhook: Svix signature verified, status = "delivered" | "bounced"
```

---

## 3. Database Schema Design

### A. EmailOutbox Model (`backend/models/emailOutbox.js`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `eventId` | String | Unique public event identifier (e.g. `evt_179335...`) |
| `idempotencyKey` | String | **Unique index**. SHA-256 hash of event type, email, and reference ID |
| `eventType` | String | Canonical event code (`borrow.approved`, `payment.success`, etc.) |
| `category` | String | Category enum (`security`, `rentals`, `due_reminders`, `transactional`) |
| `recipientUserId` | ObjectId | Reference to trusted `User` document |
| `recipientEmailSnapshot` | String | Immutable snapshot of destination email at event creation |
| `recipientNameSnapshot` | String | Immutable snapshot of recipient name |
| `templateName` | String | Target template in `emailTemplates.js` registry |
| `templateData` | Object | Parameters supplied to template renderer (sanitized) |
| `status` | String | State machine: `pending` -> `processing` -> `sent` -> `delivered` / `failed` / `bounced` |
| `attemptCount` | Number | Counter tracking retry attempts (max 5) |
| `providerMessageId` | String | Message ID returned by Resend API or simulated engine |
| `lastError` | String | Sanitized error message from last failed dispatch |
| `scheduledAt` | Date | Timestamp for worker pickup (used for exponential backoff) |
| `sentAt` | Date | Timestamp of successful provider transmission |
| `deliveredAt` | Date | Timestamp of webhook delivery confirmation |
| `deliveryEvents` | Array | Chronological audit trail of provider telemetry |

### B. Transaction Model (`backend/models/transaction.js`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `transactionRef` | String | Unique institutional receipt reference (`TXN-...`) |
| `user` | ObjectId | Trusted student reference |
| `type` | String | Enum: `fine_payment`, `rental_fee`, `deposit_held`, `deposit_refund`, `purchase` |
| `amount` | Number | Transaction amount in INR |
| `status` | String | Enum: `initiated`, `pending`, `successful`, `failed`, `refunded` |
| `isVerified` | Boolean | Server-side verification flag (required for receipt generation) |
| `verifiedAt` | Date | Timestamp of server verification |

---

## 4. Scheduled Reminder Architecture (`emailScheduler.js`)

A background polling engine runs periodic sweeps using MongoDB date operators without causing race conditions or duplicate deliveries across server restarts:

1. **Advance Due Date Sweep (48h & 24h)**: Identifies active rentals where `dueDate` falls within 48h and 24h thresholds. Dispatches `rental.due_reminder` with deterministic date-stamped idempotency keys (`rental.due_reminder:{rentalId}:{daysLeft}:{YYYY-MM-DD}`).
2. **Overdue Loan Sweep**: Identifies active loans where `dueDate < now` and status is not `completed`. Updates penalty calculation and queues `rental.overdue`.
3. **Pending Approval Sweep**: Scans borrow requests in `pending` status older than 24 hours and reminds the library desk or listing owner.
