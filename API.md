# BookNexus — API Reference

Documentation of all REST endpoints related to authentication, circulation, email notifications, preferences, transactions, and administrative monitoring.

---

## 1. Authentication & Preferences

### `GET /api/auth/email-preferences`
- **Description**: Returns the authenticated user's current email notification preferences.
- **Authorization**: Bearer JWT (`protect`)
- **Response**:
```json
{
  "success": true,
  "data": {
    "rentalUpdates": true,
    "dueReminders": true,
    "announcements": true,
    "readingUpdates": true,
    "promotional": false
  }
}
```

### `PUT /api/auth/email-preferences`
- **Description**: Updates the authenticated user's email preferences.
- **Authorization**: Bearer JWT (`protect`)
- **Request Body**:
```json
{
  "rentalUpdates": true,
  "dueReminders": true,
  "announcements": false,
  "readingUpdates": true,
  "promotional": false
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Email preferences updated successfully",
  "data": { ... }
}
```

---

## 2. Rentals & Circulation

### `POST /api/rentals`
- **Description**: Submits a borrow/rental request for a catalog book.
- **Authorization**: Bearer JWT (`protect`)
- **Request Body**: `{ "bookId": "65e0a... " }`
- **Trigger**: Queues `borrow.submitted` event to Outbox.

### `PUT /api/rentals/:id/approve`
- **Description**: Approves a rental request, sets default loan duration (14 days), and generates a 6-digit pickup OTP.
- **Authorization**: Bearer JWT (`protect`, Admin or Book Owner)
- **Trigger**: Queues `borrow.approved` event with counter pickup OTP.

### `PUT /api/rentals/:id/receive`
- **Description**: Confirms counter handover after verifying pickup OTP code.
- **Authorization**: Bearer JWT (`protect`)
- **Request Body**: `{ "otp": "839201" }`
- **Trigger**: Queues `rental.started` event.

### `POST /api/rentals/:id/penalty`
- **Description**: Assesses overdue late fines.
- **Authorization**: Bearer JWT (`protect`, Admin)
- **Request Body**: `{ "finePerDay": 10, "daysOverdue": 3 }`
- **Trigger**: Queues `rental.overdue` notice.

### `PUT /api/rentals/:id/return`
- **Description**: Confirms physical return of textbook, checks in inventory, and marks cycle completed.
- **Authorization**: Bearer JWT (`protect`, Admin or Renter)
- **Trigger**: Queues `rental.return_confirmed` and `rental.completed`.

---

## 3. Payments & Escrow Transactions

### `POST /api/payments/initiate`
- **Description**: Initiates a financial transaction (rental deposit or fine payment).
- **Authorization**: Bearer JWT (`protect`)
- **Request Body**:
```json
{
  "rentalId": "65e0a...",
  "type": "deposit_held",
  "amount": 150,
  "description": "Security deposit for Algorithms textbook"
}
```
- **Trigger**: Queues `payment.initiated` event.

### `POST /api/payments/:id/verify`
- **Description**: **Server-side independent verification**. Validates campus desk approval code or payment gateway confirmation.
- **Authorization**: Bearer JWT (`protect`, Admin)
- **Request Body**: `{ "verificationCode": "DESK-VERIF-991" }`
- **Trigger**: Transitions transaction status to `successful`, sets `isVerified: true`, and queues `payment.success` and official `transaction.receipt`.

### `POST /api/payments/:id/refund`
- **Description**: Processes release of security deposit upon safe book return.
- **Authorization**: Bearer JWT (`protect`, Admin)
- **Trigger**: Queues `payment.refund_completed`.

---

## 4. Administrative Email Activity & Outbox Monitoring

### `GET /api/admin/emails`
- **Description**: Lists transactional emails in the Outbox with safe metadata.
- **Authorization**: Bearer JWT (`protect`, Role: `admin`)
- **Query Parameters**:
  - `status`: Filter by `pending`, `sent`, `delivered`, `failed`, `bounced`.
  - `limit`: Number of records (default: 50).
  - `skip`: Pagination offset.

### `GET /api/admin/emails/stats`
- **Description**: Returns aggregate delivery metrics across the Outbox.
- **Authorization**: Bearer JWT (`protect`, Role: `admin`)
- **Response**:
```json
{
  "success": true,
  "data": {
    "total": 42,
    "pending": 0,
    "sent": 38,
    "delivered": 36,
    "failed": 2,
    "bounced": 0
  }
}
```

### `POST /api/admin/emails/:id/retry`
- **Description**: Reschedules a failed or bounced email for immediate retry.
- **Authorization**: Bearer JWT (`protect`, Role: `admin`)

---

## 5. Webhooks

### `POST /api/webhooks/resend`
- **Description**: Receives delivery telemetry from Resend (e.g. `email.delivered`, `email.bounced`, `email.complained`).
- **Headers**:
  - `svix-id`: Unique webhook delivery ID.
  - `svix-timestamp`: Unix timestamp (verified with 300s drift window).
  - `svix-signature`: HMAC-SHA256 signature generated with `EMAIL_WEBHOOK_SECRET`.
- **Response**: `200 OK`
