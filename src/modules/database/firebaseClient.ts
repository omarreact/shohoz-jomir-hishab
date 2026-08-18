import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

if (firebaseConfig.apiKey === "dummy-api-key") {
  console.warn(
    "🔥 FIREBASE WARNING: NEXT_PUBLIC_FIREBASE_API_KEY is missing in your environment variables! " +
    "Using dummy keys for build. Please check your .env file before starting the app."
  );
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
