import { Form } from "react-router";

import { Wrap, FinalScore, Stat, Val, RestartButton } from "./index.styles";

interface CompletionProps {
  correct: number;
  wrong: number;
  total: number;
  restarting: boolean;
}

export default function Completion({
  correct,
  wrong,
  total,
  restarting,
}: CompletionProps) {
  const answered = correct + wrong;
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <Wrap>
      <h2>🎉 Quiz Complete!</h2>
      <p>You&apos;ve answered all {total} AWS SAA-C03 questions.</p>

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

      <Form method="post">
        <RestartButton type="submit" disabled={restarting}>
          Restart Quiz
        </RestartButton>
      </Form>
    </Wrap>
  );
}
