// Resource route (loader only, no default export) backing the sidebar's
// infinite scroll. Fetched client-side via a fetcher to load the window of
// questions adjacent to the one currently in view.
//
//   GET /quiz/api/sidebar?anchor=<num>&filter=<all|...>&q=<text>  -> SidebarData

import type { Route } from "./+types/index";
import { requireSessionUser } from "~/lib/session.server";
import { getProgress } from "~/lib/progress.server";
import { buildSidebarData } from "~/lib/sidebar.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireSessionUser(request);
  const progress = await getProgress(user.uid);

  const url = new URL(request.url);
  const anchorRaw = url.searchParams.get("anchor");
  const anchor = anchorRaw ? Number(anchorRaw) : undefined;
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q") ?? "";

  return buildSidebarData({ results: progress.results, anchor, filter, q });
}
