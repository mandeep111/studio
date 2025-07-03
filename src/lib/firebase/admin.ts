import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // When running in a Google Cloud environment, the SDK will automatically
  // find the service account credentials. If this fails, the build will
  // now throw a much more informative error instead of continuing silently.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
