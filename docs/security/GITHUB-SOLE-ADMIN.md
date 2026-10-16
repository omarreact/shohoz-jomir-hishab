# LandBD sole administrator — GitHub @omarreact

All administrative paths and server-side admin/staff APIs use **verified Firebase ID tokens**.
Only a token signed by the LandBD Firebase project with `firebase.sign_in_provider === "github.com"`
and `firebase.identities["github.com"]` containing immutable GitHub ID **91119648** gains
`Super Admin`. A username, email, Firestore profile role, or custom claim alone cannot grant access.

## One-time OAuth setup (GitHub/Firebase owner)

1. In GitHub **Settings → Developer settings → OAuth Apps**, create an OAuth app for LandBD.
   Set its authorization callback URL to the *actual* Firebase authentication handler:
   `https://<YOUR_FIREBASE_AUTH_DOMAIN>/__/auth/handler`. Never use this placeholder literally.
2. In the LandBD Firebase project, open **Authentication → Sign-in method → GitHub**.
   Enable GitHub and add the OAuth Client ID and Client Secret there (never commit secrets).
3. Ensure `landbd.pincodeit.com` is an authorized domain in Firebase Authentication.
   Confirm that the frontend's `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` matches the chosen Firebase handler.
4. Apply the new **firestore.rules** to the **correct Firebase project** using your privileged
   Firebase deployment process. GitHub/Vercel code deployment DOES NOT apply Firestore rules.
5. Sign in at `/login` using **GitHub দিয়ে Admin Login (@omarreact)**. Validate access to
   `/admin`, `/admin/page-access`, and server-side settings endpoints. Confirm another
   GitHub account and existing password/custom-role account are denied. Test ordinary member login.
6. Review or revoke obsolete Firebase custom admin/editor claims for legacy accounts
   after verifying the owner login works. The application server ignores them for elevation.

**Important:** The app fails closed for administration until OAuth setup and the owner login
are functional. Do not treat an existing GitHub connector session as a Firebase OAuth sign-in.
Never disclose OAuth client secrets or commit Firebase service-account keys.
