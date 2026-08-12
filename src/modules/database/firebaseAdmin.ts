import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      // Application Default Credentials will be used when deployed to Vercel/GCP
      // Or you can configure specific certs here if FIREBASE_PRIVATE_KEY is set.
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
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
