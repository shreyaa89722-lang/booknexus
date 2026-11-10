# BookNexus — API Reference

Documentation of all REST endpoints related to authentication, circulation, email notifications, preferences, transactions, and administrative monitoring.

---

## 1. Authentication & Preferences

Students sign in **only** with Google, and only when their verified Google email
is on the approved college roster (`collegestudents`). There is no student
password anywhere in the flow. Librarian and admin accounts keep their own
password sign-in.

### `POST /api/auth/google`
- **Description**: The one entry point for student sign-in. Verifies a Google ID
  token with `google-auth-library` (signature, audience, issuer, `email_verified`),
  takes the email **only** from the verified payload, and checks it against the
  approved college records.
- **Authorization**: none
- **Request Body**:
```json
{ "credential": "<Google ID token from the account chooser>" }
```
- **Responses**:
  - `403` — the email is not in college records. No account is created, no token
    is issued, no profile is created.
    ```json
    { "success": false, "message": "This Google account is not registered in college records. Please use your registered college email or contact the librarian." }
    ```
  - `403` — the college email is already linked to a different Google account, or
    the Google account is already linked to a different college email.
  - `401` — the ID token could not be verified, or the Google email is unverified.
  - `400` — no `credential` was sent. An `email` in the body is never trusted.
  - `200` with `needsOnboarding: true` — approved student without a finished
    BookNexus profile. Returns a **registration token** (`data.onboardingToken`),
    not a login token, plus the student's own college record for pre-filling.
  - `200` with `needsOnboarding: false` — returning student (or an authorised
    librarian/admin using Google): returns `data.token` and the saved profile.
    Nothing saved is overwritten.

### `POST /api/auth/onboarding/verify-identity`
- **Description**: Step 1 of first-time registration. Checks full name, USN and
  date of birth against the student's approved college record.
- **Authorization**: `Bearer <onboardingToken>` (30 minutes, purpose-scoped —
  it cannot authorise any other route)
- **Request Body**:
```json
{ "name": "Full Name", "usn": "4MC23CB001", "dob": "2004-05-17" }
```
- **Response**: `200` with the verified name/USN, or `400`/`409` with a `field`
  (`name`, `usn`, `dob`) and a message safe to show inline. Refusals never reveal
  another student's name or date of birth.

### `POST /api/auth/complete-onboarding`
- **Description**: Step 2. Re-runs every step-1 check server-side, then saves the
  profile and quiz and finishes onboarding.
- **Authorization**: `Bearer <onboardingToken>`
- **Request Body**:
```json
{
  "name": "Full Name",
  "usn": "4MC23CB001",
  "dob": "2004-05-17",
  "preferredName": "Nandi",
  "bio": "A short introduction.",
  "quizAnswers": { "0": ["a"], "1": ["b"], "2": ["c"], "3": ["a"], "4": ["e"], "5": ["b"] }
}
```
- **Response**: `200` with the saved profile and a login token. A date of birth
  already on record is never overwritten; neither is a saved USN, name or quiz.

### `POST /api/auth/login`
- **Description**: Password sign-in for **librarian, admin and owner accounts only**.
- **Response**: `403` for any account whose role is `student`.

### `POST /api/auth/role-login`
- **Description**: Email + role + staff ID + password sign-in for librarians and
  admins. Unchanged, except that `role: "student"` is now refused.

### `POST /api/auth/register`
- **Description**: Retired. Always `403`. Student accounts exist only through the
  Google + college-roster flow above.

### `POST /api/auth/verify-role-eligibility`
- **Description**: Librarian/admin role check. `role: "student"` is refused — it
  used to tell any unauthenticated caller whether an email had an account, and
  that account's name and USN.

### Preferences

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
