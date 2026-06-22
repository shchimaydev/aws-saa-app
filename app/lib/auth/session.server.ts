// Session-cookie auth. The client signs in via popup and POSTs its Firebase ID
// token; we exchange it for a long-lived Firebase *session cookie* (verifiable
// server-side, revocable) and store it in an httpOnly cookie. SSR loaders read
// and verify it via the Admin SDK.

import { createCookie, redirect } from "react-router";
import { adminAuth } from "../firebase/firebase.server";

// Firebase session cookies allow up to 14 days.
const EXPIRES_IN_MS = 60 * 60 * 24 * 14 * 1000;

export const sessionCookie = createCookie("__session", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: EXPIRES_IN_MS / 1000,
  // Signed to prevent tampering. Prod value comes from a Secret Manager secret
  // (SESSION_SECRET in apphosting.yaml); dev falls back to a constant.
  secrets: [process.env.SESSION_SECRET ?? "dev-secret-change-me"],
});

/**
 * Exchange a freshly minted Firebase ID token for a session cookie and redirect,
 * setting the httpOnly cookie. Throws if the ID token is invalid/expired.
 */
export async function createUserSession(idToken: string, redirectTo: string) {
  const cookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: EXPIRES_IN_MS,
  });
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await sessionCookie.serialize(cookie) },
  });
}

/**
 * Return the signed-in user's uid, or null if there's no valid session.
 *
 * `checkRevoked` defaults to `false`: the cookie's signature + expiry are
 * verified locally (no network), which is what page reads/navigations want.
 * Pass `true` on sensitive mutations to make a round-trip to the Auth backend
 * and reject signed-out / disabled users.
 */
export async function getUserId(
  request: Request,
  checkRevoked = false,
): Promise<string | null> {
  const value = await sessionCookie.parse(request.headers.get("Cookie"));
  if (!value || typeof value !== "string") return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(value, checkRevoked);
    return decoded.uid;
  } catch {
    return null;
  }
}

/** Like getUserId but redirects to /login when unauthenticated. */
export async function requireUserId(
  request: Request,
  redirectTo = "/login",
  checkRevoked = false,
): Promise<string> {
  const uid = await getUserId(request, checkRevoked);
  if (!uid) throw redirect(redirectTo);
  return uid;
}

export interface SessionUser {
  uid: string;
  name: string;
  email: string;
  picture: string;
}

/**
 * Verify the session and return the user's profile from the cookie's claims
 * (Google sign-in populates name/picture/email — no extra getUser() call).
 */
export async function getSessionUser(
  request: Request,
  checkRevoked = false,
): Promise<SessionUser | null> {
  const value = await sessionCookie.parse(request.headers.get("Cookie"));
  if (!value || typeof value !== "string") return null;
  try {
    const d = await adminAuth.verifySessionCookie(value, checkRevoked);
    return {
      uid: d.uid,
      name: (d.name as string) ?? (d.email as string) ?? "",
      email: (d.email as string) ?? "",
      picture: (d.picture as string) ?? "",
    };
  } catch {
    return null;
  }
}

/** Like getSessionUser but redirects to /login when unauthenticated. */
export async function requireSessionUser(
  request: Request,
  redirectTo = "/login",
  checkRevoked = false,
): Promise<SessionUser> {
  const user = await getSessionUser(request, checkRevoked);
  if (!user) throw redirect(redirectTo);
  return user;
}

/** Clear the session cookie and redirect (used by logout). */
export async function destroySession(redirectTo = "/login") {
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }) },
  });
}
