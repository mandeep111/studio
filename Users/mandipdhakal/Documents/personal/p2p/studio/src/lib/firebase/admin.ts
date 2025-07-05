import { getApps, initializeApp, getApp, type App, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  // For local development, the service account JSON MUST be provided.
  if (serviceAccountJson) {
    console.log("Found FIREBASE_SERVICE_ACCOUNT_JSON. Initializing Firebase Admin SDK for local development...");
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } catch (e: any) {
      console.error("🔴🔴🔴 CRITICAL ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. 🔴🔴🔴");
      console.error("Please ensure it's a valid, single-line JSON string in your .env.local file.");
      console.error("Original Error:", e.message);
      // Throw an error that will definitely crash the build, making the problem obvious.
      throw new Error("INVALID_FIREBASE_SERVICE_ACCOUNT_JSON");
    }
  }

  // For production environments on Google Cloud (like App Hosting), use Application Default Credentials.
  // We can check for a standard Google Cloud environment variable.
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    console.log("Initializing Firebase Admin with Application Default Credentials for production...");
    return initializeApp({
      credential: applicationDefault(),
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    });
  }
  
  // If we reach here, we're likely in a local environment without the required key.
  console.error("🔴🔴🔴 CRITICAL ERROR: Firebase Admin SDK initialization failed. 🔴🔴🔴");
  console.error("The `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable is missing.");
  console.error("Please create a `.env.local` file in the root of your project and add the service account JSON to it.");
  console.error("This is required for the server-side code to connect to Firebase during local development.");
  throw new Error("MISSING_FIREBASE_SERVICE_ACCOUNT_JSON");
}

const app = getAdminApp();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app).bucket();
