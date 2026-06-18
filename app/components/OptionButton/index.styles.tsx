import styled, { css } from "styled-components";

export type OptionVariant =
  | "default"
  | "selected"
  | "correct"
  | "wrong"
  | "neutral";

export const OptBtn = styled.button<{ $variant: OptionVariant }>`
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  font-size: 13.5px;
  line-height: 1.5;
  transition:
    border-color 0.15s,
    background 0.15s;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.accent2};
    background: ${({ theme }) => theme.surface2};
  }
  &:disabled {
    cursor: default;
  }

  ${({ theme, $variant }) =>
    $variant === "selected" &&
    css`
      border-color: ${theme.accent2};
      background: rgba(74, 144, 217, 0.08);
    `}
  ${({ theme, $variant }) =>
    $variant === "correct" &&
    css`
      border-color: ${theme.green};
      background: ${theme.greenBg};
    `}
  ${({ theme, $variant }) =>
    $variant === "wrong" &&
    css`
      border-color: ${theme.red};
      background: ${theme.redBg};
    `}
  ${({ theme, $variant }) =>
    $variant === "neutral" &&
    css`
      border-color: ${theme.border};
      opacity: 0.6;
    `}
`;

export const Letter = styled.span`
  font-weight: 800;
  font-size: 13px;
  min-width: 20px;
  padding-top: 1px;
`;

export const OptText = styled.span`
  flex: 1;
`;

export const Explanation = styled.div<{ $variant: OptionVariant }>`
  font-size: 12px;
  line-height: 1.5;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 7px;

  ${({ $variant }) =>
    $variant === "correct"
      ? css`
          background: rgba(46, 204, 113, 0.08);
          color: #a8e6c5;
        `
      : css`
          background: rgba(255, 255, 255, 0.03);
          color: ${({ theme }) => theme.text2};
        `}
`;
