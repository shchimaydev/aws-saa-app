// Browser-only Firebase client app + Auth. Used by the login route for the
// Google popup sign-in flow. Never import this from server code.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  type Auth,
} from "firebase/auth";

const GSI_SRC = "https://accounts.google.com/gsi/client";

let gsiPromise: Promise<void> | null = null;

// Load the Google Identity Services client library once.
function loadGsi(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiPromise = null;
      reject(new Error("Failed to load Google Identity Services"));
    };
    document.head.appendChild(script);
  });
  return gsiPromise;
}

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
 * Sign in with Google via Google Identity Services and resolve with a fresh
 * Firebase ID token (POSTed to /auth/session to mint the server session cookie).
 *
 * Uses GIS `initTokenClient` (the OAuth handshake happens between this page and
 * accounts.google.com), then exchanges the Google access token for a Firebase
 * credential. This deliberately avoids `signInWithPopup`, so it does NOT depend
 * on the `…firebaseapp.com/__/auth/handler` Hosting path.
 */
export async function signInWithGoogle(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("signInWithGoogle() must only be called in the browser");
  }
  await loadGsi();

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      scope: "openid email profile",
      callback: (response) => {
        if (response.access_token) resolve(response.access_token);
        else reject(new Error(response.error ?? "No access token returned"));
      },
      error_callback: (error) => {
        // Surface a recognizable code for "user closed/cancelled".
        const e = new Error(error.message ?? "Sign-in cancelled");
        (e as { code?: string }).code = error.type ?? "popup_closed";
        reject(e);
      },
    });
    client.requestAccessToken();
  });

  const credential = GoogleAuthProvider.credential(null, accessToken);
  const result = await signInWithCredential(getFirebaseAuth(), credential);
  return result.user.getIdToken();
}

/** Clear the client-side Firebase auth state (server cookie cleared separately). */
export async function signOutClient(): Promise<void> {
  await signOut(getFirebaseAuth());
}
