import { redirect } from "react-router";

import { destroySession } from "~/lib/auth/session.server";

// GET /logout has no UI.
export async function loader() {
  return redirect("/login");
}

// Clears the session cookie and redirects to /login. The client-side Firebase
// sign-out (signOutClient) is triggered by the component that posts here.
export async function action() {
  return destroySession("/login");
}
