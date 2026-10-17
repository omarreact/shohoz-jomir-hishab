# LandBD Firebase sign-in and password recovery restoration — 2026-10-17

## Behavior

- The /login page signs in users with Firebase Authentication Email/Password.
- Existing email-or-username conversion for sign-in remains supported (username maps to username@landbd.com); password reset requires the **actual complete account email**.
- All Firebase-authenticated members (User, Basic User, Editor, Admin, Super Admin) may establish the existing HttpOnly session after server-side ID token verification and account-state checks.
- An authenticated non-staff member returns to their safe requested member page (or /); Admin, Super Admin and Editor go to /admin.
- /admin and nested /admin routes are protected in proxy.ts by server-side role verification. Every privileged admin API independently verifies staff/admin privileges. Opening member sessions does **not** grant them staff roles.
- Public LandBD pages stay accessible without login, following the public launch policy.
- The login page offers **পাসওয়ার্ড ভুলে গেছেন?** with a password reset mode. This calls the Firebase Web SDK sendPasswordResetEmail and uses the Firebase-hosted email-action handler. No password or Firebase admin secret reaches a custom reset endpoint.
- The recovery confirmation message does not reveal whether a Firebase account with that email exists; network/rate-limit problems show actionable errors.

## Firebase console prerequisite

Check Authentication > Sign-in method > Email/Password is enabled for the correct Firebase project (smart-khotiyan). Under Authentication > Templates, configure the password reset sender/name/template and confirm mail delivery. The Firebase default reset email action handler is used; no custom Continue URL or additional domain is requested. Configure any required authorized domains and email action settings in Firebase.

No Firebase Auth accounts or password values are altered by this GitHub change.

## Regression coverage

- Firebase session endpoint permits verified members and staff but not disabled/locked users; verifies ID tokens with Admin SDK.
- Post-login redirects keep users on local URLs, prevent open redirects, and never forward ordinary users to /admin or API/system routes.
- Existing proxy tests enforce /admin role and session requirements.

For live verification, try a test member account and a test administrator account, request one reset email (without using a production password), and confirm the reset link works and returns to Firebase-managed sign-in. Verify /admin remains inaccessible to members.
