# PinPay for LandBD — Custom Payment Checkout

**Scope:** This implementation is **exclusive to LandBD** at `landbd.pincodeit.com`. It replaces SSLCommerz *new checkout routes*, but preserves historic `landbdOrders` and `landbdEntitlements` in Firestore. This is **not** a public multi-merchant payment gateway or a regulated payment aggregator.

## Implementation

- Firebase Auth validates every payer and Super Admin.
- Firebase Firestore is authoritative for product prices, order lifecycle, admin-approved account configuration, review evidence, settlements, refunds and service entitlements.
- Checkout: `/checkout/pinpay?tran_id=LBD...`
- Payment providers (only if independently authorized and enabled): bKash, Nagad, Rocket, Upay, bank transfer.
- Member endpoints: `/api/payment/pinpay/methods`, `/api/payment/pinpay/intents`, `/api/payment/pinpay/intents/[id]`, `/api/payment/pinpay/intents/[id]/claim`.
- Super Admin: `/admin/settings/payment`, `/admin/orders`.
- Signed optional signal bridge: `POST /api/payment/pinpay/bridge/events`.
- Security: server-side price snapshots, idempotency, payer-owned reads, transaction-safe fulfillment and unique account-statement references; status changes are auditable.
- Old SSLCommerz transactions remain accessible through `/api/payment/orders` and legacy `/checkout/result`. No further checkout or SSL callback requests can be started after the old routes are removed.

## Payment states

`pending -> detected | review_requested -> paid`, or `pending -> expired` for display. A post-expiry customer claim can still be reviewed to avoid losing late transfers. `paid -> refund review -> refunded` only after an independently verified external return. No credit is ever granted based on a browser claim, image, SMS, notification or guessed balance.

**Verification is currently a supervised account-statement process**: a verified Super Admin independently checks the actual receiver business statement and manually supplies its unique reference, receiver and amount. Provider-authorized APIs, automated settlement verification, refund transfer and Android phone client are **not** implemented by these LandBD routes. Live self-service instant payment confirmation is **not** supported yet.

## Activation checklist

1. Verify LandBD's own approved merchant/payment-collection agreement for each channel; do **not** receive third-party merchant funds via a personal account. bKash offers official [online-business and API solutions](https://www.bkash.com/en/business/online-business).
2. Login as Firebase Super Admin. Navigate to `/admin/settings/payment`.
3. For each **approved** provider, enter its official 11-digit merchant number (or full bank-account routing details), registered business name, and approve the account.
4. Activate at least one correctly approved method; save the gateway `enabled` toggle. Defaults are OFF, not a false live demo.
5. Enable a paid LandBD service in `/admin/services`, then use a separate member account to test creating an intent and copying receiver details. Verify pricing and cross-user authorization.
6. Check the actual credited transfer in the official statement before approving the associated order in `/admin/orders`. Never type made-up statement references to simulate revenue.
7. For refunds, request an internal review, process the actual refund via an approved payment channel **outside** LandBD, independently verify the debit, then confirm it in the admin portal.

### Optional Android evidence API

Server-only environment variables:
- `PINPAY_BRIDGE_DEVICE_ID`: identifier of the **approved, registered** device.
- `PINPAY_BRIDGE_HMAC_SECRET`: random >=32-byte secret, never committed or exposed in the browser.
- Existing LandBD Firebase Admin and durable-rate-limit settings remain mandatory.

Send a JSON payload with UUID event ID, registered device ID, provider, receiver, amountBdt, ISO UTC receivedAt and optional providerReference. Sign `<13-digit timestamp>.<raw JSON body>` with HMAC-SHA256, put `x-pinpay-signature: sha256=<hex>`, `x-pinpay-timestamp: <epoch ms>`. Replay window is 90 seconds. Device signatures authenticate the sender but **cannot prove funds**; events are stored as candidate evidence and **never** mark paid. An Android notification-listener app needs separate implementation, user consent, data minimization, and Google Play permission compliance.

## Historic SSLCommerz order migration

**Important:** Closing SSLCommerz callbacks while historic orders remain `initiated`, `pending` or `risk_hold` means their automatic settlement can no longer complete. Before switching new checkout live, reconcile these **historical** transactions in the original merchant account; do not rewrite or delete their balances, UID mappings, or receipt IDs. PinPay's Super Admin verifier expressly **cannot** mark old gateway orders paid. Keep required financial reports for retention and disputes.

## Remaining dependencies

- Independently authorized provider APIs for true automatic payment verification and refunds.
- A supported Android bridge application (the server endpoint alone is not an Android app).
- End-to-end real-device and controlled financial QA on approved merchant accounts.
- Merchant/legal approval under applicable Bangladesh banking, MFS and payment service rules.
- Audit of composite Firestore indexes, transaction throughput, and old pending orders before live rollout.

**Do not claim this is a licensed bKash/Nagad/Rocket/Upay payment processor.** LandBD displays account routing and performs an internal manual review; money is not processed by PinPay itself.
