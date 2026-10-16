# LandBD login rollback — 2026-10-16

The previous Firebase Email/Password **email or username + password** login has been restored at `/login`. GitHub OAuth sign-in is not offered or called by the web application.

## Access behavior

- Credential login invokes `signInWithEmailAndPassword` using Firebase Auth.
- `POST /api/auth/session` verifies the ID token and establishes the existing HttpOnly session.
- Privileged role permissions are derived from **cryptographically verified Firebase custom claims**, with account status and lockouts checked through the Firebase Admin SDK/Firestore.
- Users with valid existing `Editor`, `Admin`, or `Super Admin` claims can access their authorized control-plane routes. Merely being signed in never grants admin access.
- Account management retains the previous restrictions: only Super Admin can grant Super Admin; other roles are subject to existing server-side role checks.
- Existing anti-abuse, maintenance, page-access, and audit controls remain unchanged.
- Firebase GitHub provider settings and existing identities are **not deleted**. The old standalone GitHub helper and tests remain in the repository but are not reachable as a login option.

## Deployment dependency

The checked-in `firestore.rules` has been restored to the signed-claims model. **GitHub/Vercel deployment alone does not publish Firestore Security Rules** to Firebase. Deploy rules independently through an authorized Firebase deployment:

```bash
firebase deploy --only firestore:rules --project smart-khotiyan
```

Verify the Firebase project ID and configuration before deployment. Do not upload service-account keys to GitHub.

## Regression checks

```bash
npm ci
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
```

Confirm `/login` shows only Email/Username, Password and the normal login button. Verify that an existing user signs in as a member and an existing staff account with signed custom claims reaches `/admin` (where allowed).
