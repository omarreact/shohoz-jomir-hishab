# Temporary Super Admin username/password login

This change explicitly replaces Firebase Authentication for the temporary owner
login. Firebase Admin SDK and Firestore remain the data backend. Existing
Firebase login sessions stop authorizing protected pages and APIs.

## Configure BEFORE merging/deploying

Set these server-only variables in the LandBD Vercel project for Production:

| Variable | Value |
| --- | --- |
| `LANDBD_SUPER_ADMIN_USERNAME` | `superadmin` (default if omitted) |
| `LANDBD_SUPER_ADMIN_PASSWORD` | A unique password of at least 12 characters |
| `LANDBD_ADMIN_SESSION_SECRET` | An independent random secret of at least 32 characters |

Use Secret environment variables for the password and signing secret. Do not
prefix them with NEXT_PUBLIC_, commit them to Git, or paste them into chat.
Use different secrets for Preview/Development if those environments are enabled.
Redeploy after configuration. Missing or short secrets fail closed with HTTP 503;
there is no built-in password or Firebase authentication fallback.

## Behavior

- Username/password POST to the same-origin `/api/auth/session` endpoint.
- Five login attempts per IP per minute through the existing Redis rate limiter
  (in-memory per-instance fallback if Redis is unavailable/unconfigured).
- Constant-time hashed credential comparison.
- HMAC-SHA256 signed owner session, HttpOnly/SameSite=Lax, Secure in production.
- Fixed one-hour expiry; refresh verifies rather than prolonging the session.
- Every protected API/page verifies signature and expiry server-side.
- Logout clears the browser cookie. Rotation of password, username or signing
  secret revokes all previously issued sessions. A copied cookie remains usable
  until expiration or rotation; no new server-side revocation store is added.
- Successful login goes to `/admin`.

The local identity is `local-super-admin`; its role comes only from the server.
This does not create, modify, or delete a Firebase Auth user or Firestore profile.
Firebase user-management operations in the dashboard still need the configured
Firebase Admin SDK credentials.

## Verify deployment

Check wrong-password rejection, correct login, dashboard and admin API access,
page reload session persistence, logout, and rejection of previous Firebase
sessions. Production must have HTTPS and a correctly configured proxy origin.

## Rollback

Revert the temporary-password-login commit to restore Firebase Authentication.
Remove the temporary credentials after rolling back. Tokens use a separate
format, so the Firebase login implementation will reject the temporary cookies.
