
import { getApps, initializeApp, getApp, type App, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function getAdminApp(): App {
  console.log("Attempting to initialize Firebase Admin SDK...");
  if (getApps().length > 0) {
    console.log("Firebase Admin SDK already initialized.");
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

  // For any other environment (like production on App Hosting), try Application Default Credentials.
  // This is the standard way to initialize in Google Cloud environments.
  console.log("Service account JSON not found. Attempting to initialize with Application Default Credentials for a production environment...");
  try {
    return initializeApp({
      credential: applicationDefault(),
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    });
  } catch(e: any) {
    // If applicationDefault() fails, then we really are in a misconfigured environment.
    console.error("🔴🔴🔴 CRITICAL ERROR: Firebase Admin SDK initialization failed. 🔴🔴🔴");
    console.error("Attempted to use Application Default Credentials but failed. This usually means you're running locally without setting the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable in your `.env.local` file.");
    console.error("Original Error:", e.message);
    throw new Error("ADMIN_SDK_INITIALIZATION_FAILED");
  }
}

const app = getAdminApp();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app).bucket();
