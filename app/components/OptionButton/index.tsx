import { Check, X } from "lucide-react";

import {
  Wrap,
  OptBtn,
  Letter,
  OptText,
  Mark,
  Explanation,
  type OptionVariant,
} from "./index.styles";

interface OptionButtonProps {
  letter: string;
  text: string;
  variant: OptionVariant;
  /** Explanation is shown only once the answer is revealed. */
  explanation?: string | null;
  disabled?: boolean;
  onClick?: () => void;
}

export default function OptionButton({
  letter,
  text,
  variant,
  explanation,
  disabled,
  onClick,
}: OptionButtonProps) {
  const hasExp = Boolean(explanation);

  return (
    <Wrap>
      <OptBtn
        type="button"
        $variant={variant}
        $hasExp={hasExp}
        disabled={disabled}
        onClick={onClick}
      >
        <Letter $variant={variant}>{letter}</Letter>
        <OptText>{text}</OptText>
        {variant === "correct" ? (
          <Mark $variant="correct">
            <Check size={16} />
          </Mark>
        ) : variant === "wrong" ? (
          <Mark $variant="wrong">
            <X size={16} />
          </Mark>
        ) : null}
      </OptBtn>
      {explanation ? (
        <Explanation $variant={variant}>{explanation}</Explanation>
      ) : null}
    </Wrap>
  );
}
