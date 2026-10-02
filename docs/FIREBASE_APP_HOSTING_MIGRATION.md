# LandBD — Firebase App Hosting migration

## Target architecture

GitHub `main` → Firebase App Hosting → Cloud Run + Cloud CDN

Firebase Authentication, Firestore and Firebase/Google Cloud Storage remain the
application data services. Vercel remains available only during the migration
window and can be detached after the custom-domain cutover is verified.

## Repository preparation

The repository now includes `apphosting.yaml` and runtime compatibility for:

- Firebase Admin SDK using Application Default Credentials on App Hosting.
- Existing service-account credentials while LandBD is still running on Vercel.
- Firebase Storage for private generated Mouza PDFs on App Hosting.
- Vercel Blob fallback while the current Vercel production deployment remains live.
- Provider-aware `/api/health` output.
- Vercel Analytics / Speed Insights only when the app is actually running on Vercel.

## Firebase App Hosting backend setup

Create an App Hosting backend in the existing LandBD Firebase project and connect:

- Repository: `omarreact/shohoz-jomir-hishab`
- Live branch: `main`
- App root: repository root
- Automatic rollouts: enabled

Firebase App Hosting automatically deploys new commits pushed to the configured
live branch.

## Environment configuration

Copy the production values from the existing deployment into Firebase App
Hosting Settings → Environment. Keep secrets out of Git.

At minimum verify these public Firebase web variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Server-only values depend on enabled LandBD services and can include:

- `MOUZA_DOWNLOAD_SIGNING_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- RAJUK credentials/tokens
- DLRMS overrides, when explicitly required
- LISF credentials only when the authorized LISF integration is enabled
- Cloudinary server credentials if the upload/signing endpoint is used

On Firebase App Hosting, `FIREBASE_CLIENT_EMAIL` and
`FIREBASE_PRIVATE_KEY` should not be required for normal Admin SDK access,
because the runtime uses Application Default Credentials.

## Storage migration

`LAND_EXPORT_STORAGE_PROVIDER=firebase` is set by `apphosting.yaml`.

The generated private Mouza PDF cache is stored under:

`landbd/mouza-pdf/<cache-key>/publication-v2.pdf`

The existing Vercel production runtime keeps using Vercel Blob automatically
while `BLOB_READ_WRITE_TOKEN` is present and no explicit storage provider is
set there.

## Framework compatibility gate

LandBD currently uses Next.js 16.3.7. Firebase App Hosting documentation lists
older Next.js releases as the currently active/LTS supported set, while newer
framework releases can be treated as preview until Firebase marks them active.

Do not move the public domain until a Firebase rollout of the current LandBD
code has completed successfully and the critical routes have passed smoke tests.

## Cutover checklist

1. Create the Firebase App Hosting backend.
2. Configure environment values and required secrets.
3. Roll out `main` to the Firebase-generated `.hosted.app` URL.
4. Verify:
   - `/api/health` reports `firebase-app-hosting`
   - login/logout and protected routes
   - maintenance-mode enforcement
   - DLRMS khatian search and printing
   - Mouza Porcha report generation
   - Mouza raster/vector exports
   - Firebase Storage PDF cache/retrieval
   - admin authorization
5. Use Firebase's **Migrate a domain** flow for `landbd.pincodeit.com`.
6. Update DNS only after Firebase has prepared the custom domain.
7. Verify TLS, auth cookies, API behavior and printed-document QR links.
8. Keep Vercel available for rollback until the Firebase deployment has been
   stable under real production traffic.
9. Remove Vercel domain assignment and remaining Vercel-only packages after the
   rollback window closes.
