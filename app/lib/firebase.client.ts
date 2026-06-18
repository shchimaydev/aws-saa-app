// Browser-only Firebase client app + Auth. Used by the login route for the
// Google popup sign-in flow. Never import this from server code.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

/** Lazily initialize and return the client Auth instance. Browser-only. */
export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseAuth() must only be called in the browser");
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
}

/**
 * Open the Google sign-in popup and resolve with a fresh Firebase ID token,
 * which the caller POSTs to /auth/session to mint a server session cookie.
 */
export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  return result.user.getIdToken();
}

/** Clear the client-side Firebase auth state (server cookie cleared separately). */
export async function signOutClient(): Promise<void> {
  await signOut(getFirebaseAuth());
}
