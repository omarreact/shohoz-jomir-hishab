import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        projectId,
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      console.warn("FirebaseAdmin Init: Missing credentials.", { 
        projectId: projectId, 
        hasClientEmail: !!clientEmail, 
        hasPrivateKey: !!privateKey 
      });
      initializeApp({ projectId });
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
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
