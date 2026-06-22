import { redirect } from "react-router";

import type { Route } from "./+types/index";
import { getUserId } from "~/lib/auth/session.server";
import { getProgress } from "~/lib/progress/progress.server";

// Resume where the user left off, or send them to sign in.
export async function loader({ request }: Route.LoaderArgs) {
  const uid = await getUserId(request);
  if (!uid) throw redirect("/login");
  const progress = await getProgress(uid);
  throw redirect(`/quiz/${progress.currentIdx + 1}`);
}

export default function Index() {
  return null;
}
