import { useEffect, useState } from "react";
import { Form, useNavigation, useSearchParams } from "react-router";
import { Check, ChevronLeft, ChevronRight, ListChecks, X } from "lucide-react";

import OptionButton from "~/components/OptionButton";
import type { OptionVariant } from "~/components/OptionButton/index.styles";
import type { MaybeResult } from "~/types/result";
import {
  nextHref as quizNextHref,
  prevHref as quizPrevHref,
} from "~/lib/quiz/quiz-nav";
import {
  Header,
  Badge,
  Tag,
  Text,
  OptionsGrid,
  ActionRow,
  Spacer,
  PrevLink,
  PrevDisabled,
  GenerateTestButton,
  SubmitButton,
  NextLink,
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
   * Override the prev/next targets. Defaults to the linear quiz nav (by `num`);
   * the test route passes test-scoped hrefs that walk its own question order.
   * `prevHref === null` disables the Prev control.
   */
  prevHref?: string | null;
  nextHref?: string;
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
  prevHref,
  nextHref,
}: QuestionCardProps) {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  // Scope the pending label to the generate action so an answer submit (or any
  // other navigation) doesn't flip this button to "Generating…".
  const generatingTest = navigation.formAction === "/test/generate";
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

  const qs = searchParams.toString();
  // Use the test-scoped overrides when provided, else the linear quiz nav.
  const prev = prevHref !== undefined ? prevHref : quizPrevHref(num, qs);
  const next = nextHref !== undefined ? nextHref : quizNextHref(num, total, qs);

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
          {prev ? (
            <PrevLink to={prev}>
              <ChevronLeft size={14} />
              Prev
            </PrevLink>
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

          <Spacer />

          {revealed ? (
            <NextLink to={next}>
              {num < total ? "Next" : "Finish"}
              <ChevronRight size={14} />
            </NextLink>
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
