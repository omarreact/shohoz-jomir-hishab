import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminReady = false;

function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function isPrivateKey(value: string | undefined): value is string {
  return Boolean(
    value &&
      value.includes("-----BEGIN PRIVATE KEY-----") &&
      value.includes("-----END PRIVATE KEY-----"),
  );
}

function parsedFirebaseConfig(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_CONFIG;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isGoogleManagedRuntime(): boolean {
  // Vercel may have Firebase-related environment variables configured, but
  // those do not provide Google Application Default Credentials.
  if (process.env.VERCEL) return false;

  // K_SERVICE/K_REVISION are Cloud Run runtime markers used by Firebase App
  // Hosting. Only use ADC when the process is actually running there.
  return Boolean(process.env.K_SERVICE || process.env.K_REVISION);
}

function initAdmin(): void {
  if (getApps().length) {
    adminReady = true;
    return;
  }

  const config = parsedFirebaseConfig();
  const configProjectId =
    typeof config?.projectId === "string" ? config.projectId : undefined;
  const configStorageBucket =
    typeof config?.storageBucket === "string" ? config.storageBucket : undefined;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    configProjectId;

  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    configStorageBucket;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  try {
    if (projectId && clientEmail && isPrivateKey(privateKey)) {
      initializeApp({
        projectId,
        storageBucket,
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      adminReady = true;
      return;
    }

    if (isGoogleManagedRuntime()) {
      // Firebase App Hosting / Cloud Run supplies Application Default
      // Credentials. No long-lived service-account private key is required.
      initializeApp({
        projectId,
        storageBucket,
        credential: applicationDefault(),
      });
      adminReady = true;
      return;
    }

    console.warn(
      "[FirebaseAdmin] Explicit service-account credentials are not configured. " +
        "Using a project-only local fallback.",
    );
    initializeApp({ projectId: projectId || "demo-project", storageBucket });
    adminReady = false;
  } catch (error: unknown) {
    console.error(
      "[FirebaseAdmin] initialization error:",
      error instanceof Error ? error.message : String(error),
    );

    if (!getApps().length) {
      initializeApp({ projectId: projectId || "demo-project", storageBucket });
    }

    adminReady = false;
  }
}

initAdmin();

export function isFirebaseAdminReady(): boolean {
  return adminReady;
}

export const db: Firestore = getFirestore();
export const auth: Auth = getAuth();

export const collections = {
  users: db.collection("users"),
  rajukPlots: db.collection("rajukPlots"),
  blogs: db.collection("blogs"),
  pages: db.collection("customPages"),
  settings: db.collection("siteSettings"),
  comments: db.collection("blogComments"),
  notifications: db.collection("notifications"),
  sessions: db.collection("sessions"),
  loginHistory: db.collection("loginHistory"),
  mapVisits: db.collection("mapVisits"),
  mapVisitors: db.collection("mapVisitors"),
  reportVerifications: db.collection("reportVerifications"),
};
