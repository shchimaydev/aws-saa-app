import {
  OptBtn,
  Letter,
  OptText,
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
  return (
    <OptBtn type="button" $variant={variant} disabled={disabled} onClick={onClick}>
      <Letter>{letter}</Letter>
      <OptText>
        {text}
        {explanation ? (
          <Explanation $variant={variant}>{explanation}</Explanation>
        ) : null}
      </OptText>
    </OptBtn>
  );
}
