import { getApps, initializeApp, getApp, type App, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// This function ensures that we initialize the app only once.
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    // Running locally with a service account from an env var
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } catch (error: any) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
        throw new Error("Could not initialize Firebase Admin SDK. FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
  } else {
    // Running in a Google Cloud environment (like App Hosting)
    // where Application Default Credentials are available.
    return initializeApp({
      credential: applicationDefault(),
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    });
  }
}

const app = getAdminApp();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app).bucket();
