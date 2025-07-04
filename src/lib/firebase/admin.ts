import { getApps, initializeApp, getApp, type App, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// This function ensures that we initialize the app only once.
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  
  // For local development, use the service account JSON from the environment variable.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.log("Initializing Firebase Admin with service account from environment variable.");
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        return initializeApp({
            credential: cert(serviceAccount),
            storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
        });
    } catch (e: any) {
        console.error("🔴 CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Make sure it's a valid JSON string in your .env.local file.", e.message);
        throw new Error("Could not initialize Firebase Admin SDK.");
    }
  }

  // For production environments (like App Hosting), use Application Default Credentials.
  console.log("Initializing Firebase Admin with Application Default Credentials.");
  return initializeApp({
    credential: applicationDefault(),
    storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

const app = getAdminApp();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app).bucket();
