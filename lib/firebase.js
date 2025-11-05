// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Analytics only works client-side
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Firestore for logging
export const db = getFirestore(app);

// --- Function to test Firestore connection ---
export async function testFirestoreConnection() {
  try {
    const testRef = doc(db, "_connection_test/testDoc");

    // Try writing a small test document
    await setDoc(testRef, { timestamp: Date.now() });

    // Then try reading it back
    const docSnap = await getDoc(testRef);

    if (docSnap.exists()) {
      console.log("✅ Firestore connection successful!");
      return true;
    } else {
      console.warn("⚠️ Firestore connection failed: No document found.");
      return false;
    }
  } catch (error) {
    console.error("❌ Firestore connection error:", error);
    return false;
  }
}

// testFirestoreConnection().then((connected) => {
//   if (connected) {
//     console.log("Firestore is connected and working!");
//   } else {
//     console.log("Firestore connection test failed.");
//   }
// });


export { logEvent };
