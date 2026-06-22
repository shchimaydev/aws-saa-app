// Server-only Firebase Admin app. Uses Application Default Credentials, which
// App Hosting provides automatically via its service account (no key file).
//
// Local dev: provide ADC with `gcloud auth application-default login`, or point
// at the emulators by setting FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST.
//
// IAM (deploy): the App Hosting service account needs `Service Account Token
// Creator` (for createSessionCookie/signBlob) and Firestore access (datastore.user).

import {
  initializeApp,
  getApps,
  getApp,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Inlined at build (import.meta.env) with a runtime fallback to the env var that
// App Hosting / Cloud Run sets.
const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  import.meta.env.PUBLIC_FIREBASE_PROJECT_ID;

const app: App = getApps().length
  ? getApp()
  : initializeApp({
      credential: applicationDefault(),
      projectId,
    });

export const adminAuth: Auth = getAuth(app);
export const adminDb: Firestore = getFirestore(app);
