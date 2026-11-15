import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { logger } from "@/src/shared/utils/logger";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
};

const missingClientConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => value.startsWith("dummy-"))
  .map(([key]) => key);

if (missingClientConfig.length) {
  const message =
    `Firebase client configuration is incomplete: ${missingClientConfig.join(", ")}`;

  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    throw new Error(`[LandBD] ${message}`);
  }

  logger.warn(`🔥 FIREBASE WARNING: ${message}. Dummy values are allowed only for build/dev evaluation.`);
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/** Firebase Auth only on the client. User profile/role is loaded via /api/auth/me (Admin SDK). */
const auth = getAuth(app);

export { app, auth };
