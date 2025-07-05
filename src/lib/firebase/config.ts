
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// We create a function to initialize and get the services.
// This prevents the app from crashing at build time if env vars are missing.
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

const missingConfigKey = Object.keys(firebaseConfig).find(
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingConfigKey) {
  console.error(
    `🔴 CRITICAL: Firebase config is missing '${missingConfigKey}'.`
  );
  console.error(
    "🔴 Please ensure your .env.local file is correctly set up with all NEXT_PUBLIC_FIREBASE_ variables."
  );
  console.error(
    "🔴 The application will not function correctly until this is resolved."
  );
} else {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        googleProvider = new GoogleAuthProvider();
        console.log("Firebase Client SDK initialized successfully.");
    } catch (error) {
        console.error("🔴 CRITICAL: Failed to initialize Firebase Client SDK.", error);
    }
}

export { app, auth, db, storage, googleProvider };
