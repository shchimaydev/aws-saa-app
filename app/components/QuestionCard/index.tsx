import { useEffect, useState } from "react";
import { Form, useSearchParams } from "react-router";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";

import OptionButton from "~/components/OptionButton";
import type { OptionVariant } from "~/components/OptionButton/index.styles";
import { nextHref, prevHref } from "~/lib/quizNav";
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
  result: "correct" | "wrong" | null;
  /** Correct indices — present only when revealed. */
  correct: number[] | null;
  /** Per-option explanations — present only when revealed. */
  optionExplanations: string[] | null;
  /** The user's submitted selection (for marking wrong picks). Empty on reload. */
  selectedAfter: number[];
  submitting: boolean;
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
}: QuestionCardProps) {
  const [searchParams] = useSearchParams();
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
  const prev = prevHref(num, qs);
  const next = nextHref(num, total, qs);

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
