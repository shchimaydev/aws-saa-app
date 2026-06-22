import { useNavigation } from "react-router";

import type { Route } from "./+types/index";
import { requireUserId } from "~/lib/auth/session.server";
import { getTest } from "~/lib/generated-test/test.server";
import Completion from "~/components/Completion";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Test Complete — AWS SAA Quiz" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const uid = await requireUserId(request);
  const test = await getTest(uid, params.testId, request);
  if (!test) throw new Response("Not Found", { status: 404 });
  return {
    correct: test.score.correct,
    wrong: test.score.wrong,
    total: test.questions.length,
  };
}

export default function TestComplete({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  return (
    <Completion
      correct={loaderData.correct}
      wrong={loaderData.wrong}
      total={loaderData.total}
      restarting={navigation.state !== "idle"}
      title="🎯 Test Complete!"
      subtitle={`You've finished a ${loaderData.total}-question mock exam.`}
      action="/test/generate"
      buttonLabel="Generate new test"
    />
  );
}
