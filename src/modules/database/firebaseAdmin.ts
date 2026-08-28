import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminReady = false;

function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) key = key.slice(1, -1);
  return key.replace(/\\n/g, "\n");
}

function initAdmin(): void {
  if (getApps().length) { adminReady = true; return; }
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  try {
    if (projectId && clientEmail && privateKey) {
      initializeApp({ projectId, credential: cert({ projectId, clientEmail, privateKey }) });
      adminReady = true;
      return;
    }
    console.warn("[FirebaseAdmin] Missing service-account credentials. Using project-only fallback (token verify may fail).");
    initializeApp({ projectId: projectId || "demo-project" });
    adminReady = false;
  } catch (error: unknown) {
    console.error("[FirebaseAdmin] initialization error:", error instanceof Error ? error.message : String(error));
    if (!getApps().length) initializeApp({ projectId: projectId || "demo-project" });
    adminReady = false;
  }
}

initAdmin();

export function isFirebaseAdminReady(): boolean { return adminReady; }
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
};
