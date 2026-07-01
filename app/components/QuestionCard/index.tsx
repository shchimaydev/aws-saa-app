import { useEffect, useState } from "react";
import { Form, useNavigation } from "react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";

import OptionButton from "~/components/OptionButton";
import type { OptionVariant } from "~/components/OptionButton/index.styles";
import type { MaybeResult } from "~/types/result";
import {
  Header,
  Badge,
  Tag,
  Text,
  OptionsGrid,
  ActionRow,
  Spacer,
  PrevButton,
  PrevDisabled,
  GenerateTestButton,
  ResetTestButton,
  RetryFailedButton,
  SubmitButton,
  NextButton,
  ResultBadge,
} from "./index.styles";

export interface QuestionOption {
  letter: string;
  text: string;
}

interface QuestionCardProps {
  num: number;
  total: number;
  text: string;
  multi: boolean;
  options: QuestionOption[];
  revealed: boolean;
  result: MaybeResult;
  /** Correct indices — present only when revealed. */
  correct: number[] | null;
  /** Per-option explanations — present only when revealed. */
  optionExplanations: string[] | null;
  /** The user's submitted selection (for marking wrong picks). Empty on reload. */
  selectedAfter: number[];
  submitting: boolean;
  /**
   * Navigate to the previous question. `null` disables the Prev control (e.g.
   * on the first question). The parent owns the destination.
   */
  onPrev: (() => void) | null;
  /** Navigate to the next question / finish. */
  onNext: () => void;
  /**
   * Whether this is the last question in the current sequence (so the Next
   * control reads "Finish"). Defaults to `num >= total` when omitted; pass it
   * explicitly when navigating a filtered subset, where the last question isn't
   * necessarily the highest-numbered one.
   */
  isLast?: boolean;
  /**
   * When provided (test route only), render a "Reset current test" button that
   * clears the test's results and restarts it.
   */
  onResetTest?: () => void;
  /**
   * When provided (test route only; pass when the test has wrong answers),
   * render a "Try failed questions again" button that clears only the wrong
   * answers so they can be re-attempted.
   */
  onRetryFailed?: () => void;
}

export default function QuestionCard({
  num,
  total,
  text,
  multi,
  options,
  revealed,
  result,
  correct,
  optionExplanations,
  selectedAfter,
  submitting,
  onPrev,
  onNext,
  isLast,
  onResetTest,
  onRetryFailed,
}: QuestionCardProps) {
  const lastQuestion = isLast ?? num >= total;
  const navigation = useNavigation();
  // Scope the pending label to the generate action so an answer submit (or any
  // other navigation) doesn't flip this button to "Generating…".
  const generatingTest = navigation.formAction === "/test/generate";
  // The reset action lives at /test/:testId/reset; match by suffix since the
  // dynamic testId is owned by the parent, not this component.
  const resettingTest = navigation.formAction?.endsWith("/reset") ?? false;
  // Sibling reset that clears only wrong answers; matched by its own suffix.
  const retryingFailed =
    navigation.formAction?.endsWith("/retry-wrong") ?? false;
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Reset the local selection whenever the question changes.
  useEffect(() => {
    setSelected(new Set());
  }, [num]);

  function toggle(i: number) {
    if (revealed) return;
    setSelected((prev) => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i);
        else next.add(i);
        return next;
      }
      return new Set([i]);
    });
  }

  const correctSet = new Set(correct ?? []);
  const selectedAfterSet = new Set(selectedAfter);

  function variantFor(i: number): OptionVariant {
    if (revealed) {
      if (correctSet.has(i)) return "correct";
      if (selectedAfterSet.has(i)) return "wrong";
      return "neutral";
    }
    return selected.has(i) ? "selected" : "default";
  }

  return (
    <div>
      <Header>
        <Badge>
          Q{String(num).padStart(2, "0")} / {total}
        </Badge>
        {multi ? <Tag>Choose Multiple</Tag> : null}
      </Header>

      <Text>{text}</Text>

      <Form method="post">
        <OptionsGrid>
          {options.map((opt, i) => (
            <OptionButton
              key={i}
              letter={opt.letter}
              text={opt.text}
              variant={variantFor(i)}
              explanation={revealed ? (optionExplanations?.[i] ?? null) : null}
              disabled={revealed}
              onClick={() => toggle(i)}
            />
          ))}
        </OptionsGrid>

        {/* Selected option indices submitted to the action. */}
        {!revealed &&
          [...selected].map((i) => (
            <input key={i} type="hidden" name="selected" value={i} />
          ))}

        <ActionRow>
          {onPrev ? (
            <PrevButton type="button" onClick={onPrev}>
              <ChevronLeft size={14} />
              Prev
            </PrevButton>
          ) : (
            <PrevDisabled aria-disabled="true">
              <ChevronLeft size={14} />
              Prev
            </PrevDisabled>
          )}

          {revealed && result ? (
            <ResultBadge $result={result}>
              {result === "correct" ? <Check size={14} /> : <X size={14} />}
              {result === "correct" ? "Correct!" : "Incorrect"}
            </ResultBadge>
          ) : null}

          {/* Posts the enclosing form to /test/generate via formAction so we
              avoid an invalid nested <form>; the answer fields are ignored. */}
          <GenerateTestButton
            type="submit"
            formAction="/test/generate"
            formMethod="post"
            disabled={generatingTest}
          >
            <ListChecks size={14} />
            <span>{generatingTest ? "Generating…" : "Generate a new test"}</span>
          </GenerateTestButton>

          {onResetTest ? (
            <ResetTestButton
              type="button"
              onClick={onResetTest}
              disabled={resettingTest}
            >
              <RotateCcw size={14} />
              <span>{resettingTest ? "Resetting…" : "Reset current test"}</span>
            </ResetTestButton>
          ) : null}

          {onRetryFailed ? (
            <RetryFailedButton
              type="button"
              onClick={onRetryFailed}
              disabled={retryingFailed}
            >
              <RefreshCw size={14} />
              <span>
                {retryingFailed ? "Resetting…" : "Try failed questions again"}
              </span>
            </RetryFailedButton>
          ) : null}

          <Spacer />

          {revealed ? (
            <NextButton type="button" onClick={onNext}>
              {lastQuestion ? "Finish" : "Next"}
              <ChevronRight size={14} />
            </NextButton>
          ) : (
            <SubmitButton
              type="submit"
              disabled={selected.size === 0 || submitting}
            >
              Submit Answer
            </SubmitButton>
          )}
        </ActionRow>
      </Form>
    </div>
  );
}
