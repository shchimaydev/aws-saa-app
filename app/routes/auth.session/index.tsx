import { redirect } from "react-router";

import type { Route } from "./+types/index";
import { createUserSession } from "~/lib/auth/session.server";

// No UI — this route only exchanges an ID token for a session cookie.
// A direct GET has nothing to show, so bounce to /login.
export async function loader() {
  return redirect("/login");
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const idToken = formData.get("idToken");

  if (typeof idToken !== "string" || idToken.length === 0) {
    return { error: "Missing sign-in token." };
  }

  try {
    // Returns a redirect (to /quiz/1) carrying the Set-Cookie header on success.
    return await createUserSession(idToken, "/quiz/1");
  } catch {
    return { error: "Could not verify sign-in. Please try again." };
  }
}
