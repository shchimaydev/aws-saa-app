import type { ReactNode } from "react";
import { Form } from "react-router";

import { Wrap, FinalScore, Stat, Val, RestartButton } from "./index.styles";

interface CompletionProps {
  correct: number;
  wrong: number;
  total: number;
  /** True while the form is submitting (disables the button). */
  restarting: boolean;
  title?: string;
  subtitle?: ReactNode;
  /** Form target. Omit to post to the current route (quiz restart). */
  action?: string;
  buttonLabel?: string;
}

export default function Completion({
  correct,
  wrong,
  total,
  restarting,
  title = "🎉 Quiz Complete!",
  subtitle,
  action,
  buttonLabel = "Restart Quiz",
}: CompletionProps) {
  const answered = correct + wrong;
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <Wrap>
      <h2>{title}</h2>
      <p>
        {subtitle ?? (
          <>You&apos;ve answered all {total} AWS SAA-C03 questions.</>
        )}
      </p>

      <FinalScore>
        <Stat>
          <Val $tone="green">{correct}</Val>
          <div className="lbl">Correct</div>
        </Stat>
        <Stat>
          <Val $tone="red">{wrong}</Val>
          <div className="lbl">Wrong</div>
        </Stat>
        <Stat>
          <Val $tone="accent">{pct}%</Val>
          <div className="lbl">Score</div>
        </Stat>
      </FinalScore>

      <Form method="post" action={action}>
        <RestartButton type="submit" disabled={restarting}>
          {buttonLabel}
        </RestartButton>
      </Form>
    </Wrap>
  );
}
