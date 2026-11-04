# BookNexus — Integrations & Third-Party Services

Documentation of external integrations, authentication providers, transactional email transports, and blockchain ledger connectors.

---

## 1. Resend Transactional Email Engine

- **Provider**: Resend ([https://resend.com](https://resend.com))
- **Official SDK**: `resend` (Node.js SDK)
- **Environment Variables**:
  - `RESEND_API_KEY`: Secret API key beginning with `re_...`
  - `EMAIL_FROM`: Configured verified sender address (e.g., `notifications@booknexus.edu`)
  - `EMAIL_FROM_NAME`: Display name (`BookNexus`)
  - `EMAIL_REPLY_TO`: Support inbox (e.g., `support@booknexus.edu`)
  - `EMAIL_WEBHOOK_SECRET`: Svix webhook signing secret beginning with `whsec_...`
- **Webhook Endpoint**: `POST /api/webhooks/resend`
- **Supported Webhook Events**:
  - `email.sent`: Initial provider dispatch
  - `email.delivered`: Mailbox delivery confirmation
  - `email.bounced`: Hard or soft bounce
  - `email.complained`: Spam complaint

---

## 2. Google Identity Services (Google OAuth)

- **Authentication Protocol**: OAuth 2.0 Web Client using Google Identity Services (GSI)
- **Client ID**: `678657142900-oibcoi8ind88u1l11e6mgk5cic8qqasm.apps.googleusercontent.com`
- **Backend Verification**: `google-auth-library` (`OAuth2Client.verifyIdToken`)
- **Flow**:
  1. Frontend triggers Google popup credential picker.
  2. Google issues signed JWT credential to browser.
  3. Frontend transmits credential to `POST /api/auth/google`.
  4. Backend independently verifies signature against Google's public certificates.
  5. Backend resolves or creates student user, issues application JWT, and queues `onUserLogin` or `onUserRegistered` notification.

---

## 3. MongoDB Atlas & Local Persistent Database

- **Driver**: Mongoose (ODM)
- **Primary Connection**: MongoDB Atlas cloud cluster with fallback to local persistent instance (`mongodb://127.0.0.1:27017/bookhive`).
- **Resilience**: Auto-reconnect and graceful error fallback on Atlas network/IP whitelist events.

---

## 4. Blockchain & EVM Smart Contracts (Hardhat / Local Node)

- **Service**: `backend/services/blockchainService.js`
- **Capabilities**:
  - `recordRentalOnChain(bookId, borrowerAddress, dueDateUnix)`: On-chain ledger logging for active rental contracts.
  - `recordReturnOnChain(rentalId)`: On-chain return verification.
- **Fail-Safe Operation**: Smart contract recording runs with non-fatal try/catch handlers, ensuring that physical library circulation continues uninterrupted even if local blockchain RPC is offline.
