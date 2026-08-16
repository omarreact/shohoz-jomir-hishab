import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  let initialized = false;
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (privateKey) {
      // Remove any surrounding quotes that might have been accidentally pasted
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        projectId,
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      initialized = true;
    } else {
      console.warn("FirebaseAdmin Init: Missing credentials.");
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
  }

  // Fallback to prevent top-level module crash when calling getFirestore()
  if (!initialized && !getApps().length) {
    const fallbackProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project";
    initializeApp({ projectId: fallbackProjectId });
  }
}

export const db = getFirestore();
export const auth = getAuth();

export const collections = {
  users: db.collection('users'),
  rajukPlots: db.collection('rajukPlots'),
  blogs: db.collection('blogs'),
  pages: db.collection('customPages'),
  settings: db.collection('siteSettings'),
  comments: db.collection('blogComments'),
  notifications: db.collection('notifications'),
  sessions: db.collection('sessions'),
  loginHistory: db.collection('loginHistory'),
};
