import { useNavigation, useSearchParams } from "react-router";

import type { Route } from "./+types/index";
import { requireUserId } from "~/lib/auth/session.server";
import { getQuestion } from "~/lib/questions/questions.server";
import { getTest, recordTestAnswer } from "~/lib/generated-test/test.server";
import { testNextHref, testPrevHref } from "~/lib/generated-test/test-nav";
import QuestionCard from "~/components/QuestionCard";
import type { MaybeResult } from "~/types/result";

// Options are stored as "A. ...". Strip the leading "A. " for display.
function parseOption(opt: string, i: number) {
  const letter = opt[0] || String.fromCharCode(65 + i);
  const text = opt.length > 2 ? opt.substring(3) : opt;
  return { letter, text };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const uid = await requireUserId(request);
  const { testId } = params;
  const num = Number(params.num);

  const test = await getTest(uid, testId, request);
  if (!test) throw new Response("Not Found", { status: 404 });
  const index = test.questions.indexOf(num);
  if (index < 0) throw new Response("Not Found", { status: 404 });

  const question = getQuestion(num);
  if (!question) throw new Response("Not Found", { status: 404 });

  const storedResult = test.results[String(num)] ?? null;
  const answered = storedResult !== null;

  const base = {
    num,
    testId,
    questions: test.questions,
    // Position within the test (1-based) and its length, for the Q badge.
    position: index + 1,
    length: test.questions.length,
    text: question.text,
    multi: question.multi || question.correct.length > 1,
    options: question.options.map(parseOption),
    answered,
    result: storedResult,
  };

  // Withhold the correct answers + explanations until the question is answered.
  if (answered) {
    return {
      ...base,
      correct: question.correct,
      optionExplanations: question.optionExplanations,
    };
  }
  return { ...base, correct: null, optionExplanations: null };
}

export async function action({ request, params }: Route.ActionArgs) {
  // Sensitive write — verify revocation against the Auth backend.
  const uid = await requireUserId(request, "/login", true);
  const { testId } = params;
  const num = Number(params.num);

  const test = await getTest(uid, testId);
  if (!test) throw new Response("Not Found", { status: 404 });
  if (!test.questions.includes(num))
    throw new Response("Not Found", { status: 404 });

  const question = getQuestion(num);
  if (!question) throw new Response("Not Found", { status: 404 });

  const form = await request.formData();
  const selected = [
    ...new Set(
      form
        .getAll("selected")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n)),
    ),
  ].sort((a, b) => a - b);

  const correctSorted = [...question.correct].sort((a, b) => a - b);
  const isCorrect =
    selected.length === correctSorted.length &&
    selected.every((v, i) => v === correctSorted[i]);
  const result = isCorrect ? "correct" : "wrong";

  await recordTestAnswer(uid, testId, num, result);

  return {
    selected,
    result,
    correct: question.correct,
    optionExplanations: question.optionExplanations,
  };
}

export default function TestQuestion({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();

  // Revealed once answered (from the test) or immediately after submitting.
  const revealed = loaderData.answered || Boolean(actionData);
  const result = (actionData?.result ?? loaderData.result) as MaybeResult;
  const correct = actionData?.correct ?? loaderData.correct;
  const optionExplanations =
    actionData?.optionExplanations ?? loaderData.optionExplanations;
  const selectedAfter = actionData?.selected ?? [];

  const { testId, num, questions, position, length } = loaderData;

  return (
    <QuestionCard
      key={num}
      num={position}
      total={length}
      text={loaderData.text}
      multi={loaderData.multi}
      options={loaderData.options}
      revealed={revealed}
      result={result}
      correct={correct}
      optionExplanations={optionExplanations}
      selectedAfter={selectedAfter}
      submitting={submitting}
      prevHref={testPrevHref(testId, num, questions, qs)}
      nextHref={testNextHref(testId, num, questions, qs)}
    />
  );
}
