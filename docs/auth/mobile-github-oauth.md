# GitHub administrator login: mobile and embedded browsers

LandBD uses Firebase Authentication and Firestore. Administrator privileges are **server-side** and belong only to the Firebase-verified GitHub identity whose GitHub numeric user ID is `91119648`. Signing into GitHub does not authorize a different GitHub account or grant privileges via email, display name, or stale Firestore roles.

## Existing deployment

- Canonical site: https://landbd.pincodeit.com
- Firebase project: `smart-khotiyan`
- GitHub OAuth SDK: `GithubAuthProvider`
- Browser session: `POST /api/auth/session` (Firebase ID token -> HttpOnly session)
- Server authorization: `src/modules/auth/serverAuth.ts` and `src/modules/auth/soleAdmin.ts`
- Browser helper routes: `next.config.ts` proxies `/__/auth/:path*` transparently to Firebase Hosting

## Why the popup fails

The Android in-app browser may block or close `signInWithPopup`. LandBD previously used `signInWithRedirect` only when `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` matched the site hostname, and otherwise attempted a popup. The updated client:
- Uses a same-origin redirect on mobile **only if configured**.
- Uses a popup in ordinary external browsers until redirect configuration is complete.
- Avoids popups inside identifiable embedded browsers if the redirect helper is not configured.
- Displays Android Chrome and copy-link options on mobile.
- Requires the verified Firebase server session to report `Super Admin` before completing GitHub-admin sign-in, including redirect returns.

## One-time OAuth configuration required for reliable mobile redirect

The helper proxy alone is not enough. Complete this coordinated change:

1. At GitHub → Settings → Developer settings → OAuth Apps → the LandBD app, set **Authorization callback URL** to:
   `https://landbd.pincodeit.com/__/auth/handler`
2. In Firebase Authentication → Settings → Authorized domains, confirm:
   `landbd.pincodeit.com`
3. In the **Vercel LandBD project environment** (Production), set:
   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=landbd.pincodeit.com`
4. Keep Firebase OAuth Provider GitHub **Client ID / Client Secret** as already configured. Never copy the secret into `NEXT_PUBLIC_*` variables.
5. Redeploy production after setting the variable. Confirm:
   `https://landbd.pincodeit.com/__/auth/handler` is served by the existing internal helper rewrite (not redirected to Firebase Hosting and not blocked by site maintenance).
6. Test in normal Android Chrome, iOS Safari, and an in-app browser. After the redirect returns, `/api/auth/session` must establish a valid HttpOnly cookie and `/admin` must authorize only the allowlisted account.

**Important:** Do **not** set the new `authDomain` until the GitHub OAuth callback URL has been changed to match. GitHub OAuth Apps have a registered callback URL; a mismatch can break all GitHub sign-in attempts.

## Regression checks

```bash
npm ci
npm run typecheck
npm test -- --runInBand src/modules/auth/githubBrowser.test.ts src/modules/auth/soleAdmin.test.ts
npm run build
```

The code change does not modify database rules, Firebase provider credentials, protected routes, maintenance-mode behavior, payment processing, or the production Vercel environment.
