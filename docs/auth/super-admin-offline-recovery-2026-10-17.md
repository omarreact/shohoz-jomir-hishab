# LandBD — new Firebase Super Admin account recovery

This is a local two-stage operation. It does not edit/delete the original
owner identity, publish a web bootstrap endpoint, or write credentials to GitHub.

## Prerequisites

- Control the Firebase project smart-khotiyan and a Google identity with
  sufficient permission to manage Firebase Auth users/custom claims and Firestore.
- Use Node 22, npm ci, and a trusted LOCAL interactive terminal. Never run this
  procedure in GitHub Actions, Vercel builds, hosted routes or browser consoles.
- Prefer short-lived Google Cloud Application Default Credentials (ADC). If using
  a Firebase service account JSON, store it OUTSIDE the repository and set
  GOOGLE_APPLICATION_CREDENTIALS to its absolute local filesystem path.
- Use a NEW email inbox that you personally control. Do not share passwords,
  service account keys, verification links, or password-reset links in chat.

## Stage 1 — Prepare the new UNPRIVILEGED account

In Windows PowerShell, inside the cloned LandBD repository:

    npm ci
    gcloud auth application-default login
    $env:GOOGLE_CLOUD_PROJECT="smart-khotiyan"
    node scripts/bootstrap-super-admin.mjs prepare --email="NEW_ADMIN_EMAIL" --name="New Admin"

macOS or Linux:

    npm ci
    gcloud auth application-default login
    export GOOGLE_CLOUD_PROJECT="smart-khotiyan"
    node scripts/bootstrap-super-admin.mjs prepare --email="NEW_ADMIN_EMAIL" --name="New Admin"

If your organization prefers a dedicated service account, configure
GOOGLE_APPLICATION_CREDENTIALS instead of gcloud login.

The script checks its execution environment and requires an exact typed
confirmation. It creates a new Firebase Email/Password account with a
cryptographically random unprinted password, no admin claims, and a Basic User
Firestore profile. It refuses an existing email, so nothing gets overwritten.

## Stage 2 — Verify the account email

    node scripts/bootstrap-super-admin.mjs verification-link --email="NEW_ADMIN_EMAIL"

The Admin SDK generates a one-time Firebase email verification link shown only
in your local terminal. Open it in your own browser for your own inbox, or
deliver it only to the intended inbox owner through a secure channel. Treat the
URL as a secret and never paste it into chat or source control.

The Firebase Admin SDK generates the verification link but does NOT send email
automatically. Once verified, visit https://landbd.pincodeit.com/login, choose
Forgot Password, and use Firebase's reset email to create a strong password.

## Stage 3 — Grant Super Admin ONLY after verification

    node scripts/bootstrap-super-admin.mjs activate --email="NEW_ADMIN_EMAIL"

The script verifies the email ownership flag, checks the special preparation
marker and current account status, refuses the original owner's UID, then
issues signed Firebase custom claims role=Super Admin and admin=true.
It updates Firestore and writes an adminAuditLog entry. Any post-grant error
triggers a best-effort rollback with explicit warnings.

It preserves existing accounts and their claims, including the original Super
Admin. It never grants access based only on an email parameter from the web.

## Stage 4 — Verify real login

1. Open a fresh private browser session and sign in at
   https://landbd.pincodeit.com/login with the new email and new password.
2. Verify /admin, /admin/users and /admin/page-access are accessible.
3. Verify an ordinary Firebase member remains blocked from /admin and admin APIs.
4. Check Firebase Authentication, Firestore users/{uid} and adminAuditLog.
5. Keep the original Super Admin UID and account unchanged.
6. Enable MFA if available, and keep the recovery account email secure.

## Important

This script is preparation only until an authorized operator actually runs it
with privileged Firebase credentials. No Firebase Auth users are automatically
created by merely merging the script. If the target email already belongs to an
existing user, use a new dedicated recovery email rather than bypassing checks.

Official Firebase guidance:
https://firebase.google.com/docs/admin/setup
https://firebase.google.com/docs/auth/admin/manage-users
https://firebase.google.com/docs/auth/admin/custom-claims
