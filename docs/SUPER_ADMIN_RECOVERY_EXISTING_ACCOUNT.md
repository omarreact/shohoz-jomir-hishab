# LandBD: recover Super Admin access for an existing Firebase user

This guide applies when a new **Email/Password user already exists** in
Firebase Authentication for project `smart-khotiyan`, and its UID has a
Firestore document at `users/{uid}`.

The normal application deliberately **does not trust the Firestore role
field** to elevate access. Only signed Firebase Authentication custom
claims grant access to privileged routes. Do not add new hard-coded
administrator UIDs, switch off Firebase authentication, or add public
"bootstrap" endpoints.

## Verify the account before activation

1. Select project `smart-khotiyan` in Firebase Authentication → Users.
2. Copy the **new user's UID**. Do not use the existing owner's UID.
3. Confirm `users/{uid}` exists with the **same email**, and `status`
   is `active`. Saving a document in `admin_users` is insufficient.
4. Ensure the email is genuinely verified in **Firebase Authentication**.
   Firestore `isVerified: true` alone does **not** verify it.
5. Keep the original account and existing users intact.

## Run from a trusted interactive Google Cloud Shell

Sign in with the Google account that has permission to administer this
Firebase project. Run `gcloud auth application-default login` within
Cloud Shell. Firebase Auth user management and Firestore write IAM
permissions are required. Do not download a service-account private key.

```bash
gcloud config set project smart-khotiyan
gcloud auth application-default login
mkdir -p ~/landbd-admin-recovery && cd ~/landbd-admin-recovery
curl -fsSL https://raw.githubusercontent.com/omarreact/shohoz-jomir-hishab/main/scripts/activate-existing-super-admin.mjs -o activate-existing-super-admin.mjs
npm init -y
npm install firebase-admin
```

Replace `YOUR_EMAIL` and `YOUR_UID` locally, *not* in the source code.

**Inspect** (read-only):

```bash
node activate-existing-super-admin.mjs inspect --email=YOUR_EMAIL --uid=YOUR_UID
```

If email verification is still incomplete, generate a one-time URL:

```bash
node activate-existing-super-admin.mjs verification-link --email=YOUR_EMAIL --uid=YOUR_UID
```

Keep the generated verification URL private and open it as the mailbox
owner; do not paste it in GitHub or support messages. Re-run `inspect`
and confirm `Email verified in Firebase Auth: true`.

**Activate** (privileged mutation):

```bash
node activate-existing-super-admin.mjs activate --email=YOUR_EMAIL --uid=YOUR_UID
```

The script asks for exact typed confirmation, compares UID/email in
Firebase Auth and Firestore, checks account state, and fails closed if
they do not match. It writes audit records to `adminAuditLog` before
and after issuing claims, and attempts rollback if later steps fail.
The existing administrator's UID is explicitly excluded.

The resulting Firebase Auth custom claims are:

```json
{"role":"Super Admin","admin":true}
```

After success, sign out of LandBD and sign in again at
https://landbd.pincodeit.com/login to obtain a fresh Firebase token.
Open https://landbd.pincodeit.com/admin and a Super Admin-only page
to confirm privileges. There is **no need to deploy new web code**
merely to issue custom claims.

If activation fails, do not edit the production authentication code
to bypass authorization. Inspect the reported error and confirm the
correct Google IAM permissions and Firebase project.
