import { useNavigate, useNavigation, useSearchParams } from "react-router";

import type { Route } from "./+types/index";
import { requireUserId } from "~/lib/auth/session.server";
import { getQuestion, TOTAL_QUESTIONS } from "~/lib/questions/questions.server";
import { getProgress, recordAnswer } from "~/lib/progress/progress.server";
import {
  nextHref as quizNextHref,
  prevHref as quizPrevHref,
  nextInListHref,
  prevInListHref,
} from "~/lib/quiz/quiz-nav";
import { filteredQuizNums } from "~/lib/quiz/sidebar.server";
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
  const num = Number(params.num);
  const question = getQuestion(num);
  if (!question) throw new Response("Not Found", { status: 404 });

  const progress = await getProgress(uid, request);
  const storedResult = progress.results[String(num - 1)] ?? null;
  const answered = storedResult !== null;

  // When a sidebar filter/search is active, Next/Prev step through only the
  // matching questions. We compute the matching set here (it reflects post-answer
  // progress, since loaders revalidate after the answer action); null means no
  // filter, so the component falls back to plain sequential navigation.
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q") ?? "";
  const filtering = q.trim() !== "" || filter !== "all";
  const filteredNums = filtering
    ? filteredQuizNums({ results: progress.results, filter, q })
    : null;

  const base = {
    num,
    total: TOTAL_QUESTIONS,
    text: question.text,
    multi: question.multi || question.correct.length > 1,
    options: question.options.map(parseOption),
    answered,
    result: storedResult,
    filteredNums,
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
  const num = Number(params.num);
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

  await recordAnswer(uid, num - 1, result);

  return {
    selected,
    result,
    correct: question.correct,
    optionExplanations: question.optionExplanations,
  };
}

export default function QuizQuestion({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();

  // Revealed once answered (from progress) or immediately after submitting.
  const revealed = loaderData.answered || Boolean(actionData);
  const result = (actionData?.result ?? loaderData.result) as MaybeResult;
  const correct = actionData?.correct ?? loaderData.correct;
  const optionExplanations =
    actionData?.optionExplanations ?? loaderData.optionExplanations;
  const selectedAfter = actionData?.selected ?? [];

  const { filteredNums } = loaderData;
  const prev = filteredNums
    ? prevInListHref(loaderData.num, filteredNums, qs)
    : quizPrevHref(loaderData.num, qs);
  const next = filteredNums
    ? nextInListHref(loaderData.num, filteredNums, qs)
    : quizNextHref(loaderData.num, loaderData.total, qs);
  const isLast = filteredNums
    ? !filteredNums.some((n) => n > loaderData.num)
    : loaderData.num >= loaderData.total;

  return (
    <QuestionCard
      key={loaderData.num}
      num={loaderData.num}
      total={loaderData.total}
      text={loaderData.text}
      multi={loaderData.multi}
      options={loaderData.options}
      revealed={revealed}
      result={result}
      correct={correct}
      optionExplanations={optionExplanations}
      selectedAfter={selectedAfter}
      submitting={submitting}
      onPrev={prev ? () => navigate(prev) : null}
      onNext={() => navigate(next)}
      isLast={isLast}
    />
  );
}
