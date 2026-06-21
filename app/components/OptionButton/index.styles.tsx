import styled, { css } from "styled-components";

export type OptionVariant =
  | "default"
  | "selected"
  | "correct"
  | "wrong"
  | "neutral";

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const OptBtn = styled.button<{
  $variant: OptionVariant;
  $hasExp: boolean;
}>`
  background: ${({ theme }) => theme.overlaySoft};
  border: 1px solid ${({ theme }) => theme.hairline};
  border-radius: 9px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  color: ${({ theme }) => theme.optText};
  font-size: 14px;
  line-height: 1.6;
  transition:
    border-color 0.15s,
    background 0.15s;
  display: flex;
  gap: 11px;
  align-items: flex-start;
  width: 100%;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.accent2};
    background: ${({ theme }) => theme.overlay};
  }
  &:disabled {
    cursor: default;
  }

  ${({ theme, $variant }) =>
    $variant === "selected" &&
    css`
      border-color: ${theme.accent2};
      background: rgba(74, 144, 217, 0.1);
    `}
  ${({ $variant }) =>
    $variant === "correct" &&
    css`
      border-color: rgba(34, 197, 94, 0.35);
      background: rgba(34, 197, 94, 0.08);
    `}
  ${({ $variant }) =>
    $variant === "wrong" &&
    css`
      border-color: rgba(232, 64, 64, 0.35);
      background: rgba(232, 64, 64, 0.08);
    `}
  ${({ $variant }) =>
    $variant === "neutral" &&
    css`
      opacity: 0.6;
    `}

  /* Square the bottom edge so the explanation box reads as one attached card. */
  ${({ $hasExp }) =>
    $hasExp &&
    css`
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    `}
`;

export const Letter = styled.span<{ $variant: OptionVariant }>`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fontMono};
  font-weight: 600;
  font-size: 11px;

  background: ${({ theme, $variant }) =>
    $variant === "correct"
      ? "rgba(34, 197, 94, 0.2)"
      : $variant === "wrong"
        ? "rgba(232, 64, 64, 0.2)"
        : $variant === "selected"
          ? "rgba(74, 144, 217, 0.2)"
          : theme.overlay};
  color: ${({ theme, $variant }) =>
    $variant === "correct"
      ? theme.green
      : $variant === "wrong"
        ? theme.red
        : $variant === "selected"
          ? theme.accent2
          : theme.textMono};
`;

export const OptText = styled.span`
  flex: 1;
  min-width: 0;
  padding-top: 2px;
`;

// Mark icon (✓ / ✗) shown on the right once the answer is revealed.
export const Mark = styled.span<{ $variant: OptionVariant }>`
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  color: ${({ theme, $variant }) =>
    $variant === "correct" ? theme.green : theme.red};
`;

export const Explanation = styled.div<{ $variant: OptionVariant }>`
  font-size: 13px;
  line-height: 1.65;
  padding: 11px 16px;
  border: 1px solid;
  border-top: none;
  border-bottom-left-radius: 9px;
  border-bottom-right-radius: 9px;

  ${({ theme, $variant }) =>
    $variant === "correct"
      ? css`
          background: rgba(34, 197, 94, 0.05);
          border-color: rgba(34, 197, 94, 0.15);
          color: #8891ab;
        `
      : css`
          background: ${theme.overlaySoft};
          border-color: ${theme.hairline};
          color: ${theme.text2};
        `}
`;
