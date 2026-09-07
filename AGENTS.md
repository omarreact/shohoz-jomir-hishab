# ADDITIONAL MANDATORY ARCHITECTURE REQUIREMENTS

These requirements override any assumption that the project should use Prisma, Supabase, or another database/authentication system for core application data.

---

## 1. FIREBASE IS THE PRIMARY DATABASE

ALL application database/data management must remain on Firebase.

Use:
* Firebase Firestore
* Firebase Authentication
* Firebase Admin SDK
* Firebase Client SDK

Firebase must remain the single source of truth for:
* users
* user profiles
* authentication
* roles
* admin permissions
* login history
* sessions
* site settings
* RAJUK configuration
* RAJUK token configuration
* blogs
* custom pages
* application settings
* user-related application data
* other existing Firestore collections

Do NOT migrate these systems to Prisma, PostgreSQL, Supabase, MySQL, MongoDB, or another database unless explicitly requested.

---

## 2. USER AUTHENTICATION MUST REMAIN FIREBASE
All user authentication must be maintained through Firebase Authentication.
The authentication flow should remain conceptually:
User -> Firebase Authentication -> Firebase ID Token -> Secure server-side verification -> Application session/auth state -> Protected routes

Continue using the existing: Firebase Auth, next-firebase-auth-edge, Firebase Admin SDK, useAuth, middleware, access_token/session mechanism. Fix the existing implementation instead of replacing it.

---

## 3. ADMIN AUTHENTICATION
Admin authentication/authorization must also remain Firebase-based.
Use secure server-side verification.
Prefer Firebase Custom Claims and/or secure Firestore role data for determining administrator privileges.
Do NOT rely solely on `email.includes("admin")` as an authorization mechanism. The client must never be trusted to determine whether somebody is an administrator. Every sensitive admin API must independently verify authorization on the server.

---

## 4. FIREBASE ADMIN SDK
Maintain one properly initialized Firebase Admin SDK instance.
Prevent duplicate initialization, missing Project ID, invalid private key, malformed service-account credentials, and client-side exposure of Admin SDK credentials.
Correctly process FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY including escaped newline characters where necessary.
The implementation must work both in Local development and Vercel production.

---

## 5. FIRESTORE DATA ACCESS
All server-side database operations should use Firebase Admin SDK / Firestore where appropriate.
All client-side operations should use the Firebase Client SDK only where client access is actually appropriate and protected by Firestore security rules.
Do not create duplicate database abstraction layers unnecessarily. Centralize Firestore access where practical.

---

## 6. SUPABASE / PRISMA
Supabase and Prisma must NOT become the database/authentication system for this project.
If Supabase is merely configured for future use but is not currently required, do not migrate Firebase data to Supabase.
If Prisma exists in the repository but is not actually used, do not introduce new Prisma functionality. Do not create `prisma/schema.prisma` or Prisma migrations just to satisfy a generic database requirement.

---

## 7. DATABASE ARCHITECTURE
The intended architecture is:
- Authentication: Firebase Authentication
- User/Application Database: Firebase Firestore
- Server-side privileged access: Firebase Admin SDK
- RAJUK external data: RAJUK APIs / ArcGIS services
- RAJUK token configuration: Firestore + existing secure server-side token management
- Optional caching: Redis, only where the existing application actually requires it
Do not replace these systems unnecessarily.

---

# 8. /DAP-MAP UI REQUIREMENT
The `/dap-map` page is a major application feature. Make it visually polished, responsive, and easy to use.
Use the existing project's UI system first. If Bootstrap is genuinely useful for the DAP map interface, controls, responsive layout, cards, modals, tabs, or map controls, you may add/use Bootstrap. However, do not introduce Bootstrap unnecessarily, do not duplicate Tailwind and Bootstrap styles, avoid CSS conflicts, and use one consistent design language.

---

# 9. DAP-MAP SHOULD SUPPORT
The `/dap-map` page should provide a professional GIS interface including:
full-screen map, layer control, basemap selector, zoom controls, location control, search, plot/layer information, legend, layer visibility, loading indicators, API status, public/private layer indicators, feature information, popup/details panel, responsive sidebar/panel, mobile-friendly controls.
Use Leaflet/React-Leaflet because that is already part of the project's architecture.

---

# 10. DAP-MAP PUBLIC FALLBACK
This is mandatory. When the RAJUK private token is empty, missing, invalid, expired, rejected, or unavailable, the `/dap-map` page MUST continue loading all publicly available RAJUK data.
Never allow private authentication failure to make `/dap-map` blank.

---

# 11. DAP-MAP BOOTSTRAP REQUIREMENT
If Bootstrap is needed to make `/dap-map` properly functional or visually polished, install and configure it correctly. Before adding Bootstrap, check whether the existing Tailwind/Radix UI implementation already satisfies the requirement.

---

# 12. ADMIN API TEST PAGE
The Admin -> Test API page must also follow the Firebase architecture. Authentication state should come from the application's Firebase authentication/session system. Divide the page into পাবলিক API and প্রাইভেট API.
A valid Firebase-authenticated administrator may manage/test the configured private APIs. Do not confuse Firebase authentication with RAJUK API authentication.

---

# 13. ADMIN RAJUK TOKEN MANAGEMENT
The RAJUK API token should be managed through the existing secure architecture.
Do not expose the stored RAJUK token unnecessarily to the browser. Do not display the complete token in logs. Mask sensitive values.

---

# 14. FIREBASE ERROR HANDLING
Any Firebase failure must produce a useful error. Do not show only "500 Internal Server Error". Instead, log the real server-side error and show an appropriate Bangla message to the user (e.g. "ব্যবহারকারীদের তথ্য লোড করা যায়নি।"). Do not expose sensitive Firebase credentials or internal stack traces to users.

---

# 15. VERCEL REQUIREMENT
The final deployment must preserve the Firebase architecture. Before deployment verify that Vercel contains all required Firebase environment variables. Never commit the Firebase service account JSON to GitHub. Never expose FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL in client-side JavaScript.

---

# 16. FINAL ARCHITECTURE RULE
USER AUTHENTICATION -> Firebase Authentication
USER / APPLICATION DATABASE -> Firebase Firestore
SERVER ADMIN ACCESS -> Firebase Admin SDK
ADMIN AUTHORIZATION -> Firebase Custom Claims / secure Firestore role
RAJUK AUTHENTICATION -> RAJUK token managed server-side
RAJUK DATA -> RAJUK/ArcGIS APIs
MAP -> Leaflet + React-Leaflet
UI -> Existing Tailwind/Radix system, Bootstrap ONLY if genuinely beneficial for /dap-map
OPTIONAL CACHE -> Redis where already required

---

# 17. FINAL VERIFICATION
Before deployment verify all features and functionality as outlined in the initial architectural constraints document.
