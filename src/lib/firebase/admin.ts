import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment, the SDK will automatically
    // find the service account credentials.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
    });
  } catch (error: any) {
    // If the error is about credentials, it might be a local dev environment.
    // In a real production app, you would handle this more gracefully,
    // perhaps by loading a service account key file for local development.
    if (error.code === 'credential-already-exists') {
        // This is fine, means we've already initialized.
    } else {
        console.error('Firebase admin initialization error', error);
    }
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
