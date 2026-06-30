import { Form } from "react-router";
import styled, { css } from "styled-components";

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
`;

// "Q04 / 12" position badge.
export const Badge = styled.span`
  background: rgba(255, 153, 0, 0.1);
  color: ${({ theme }) => theme.accent};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
`;

// Neutral tag slot (e.g. "Choose Multiple"), styled like the design's category chip.
export const Tag = styled.span`
  background: ${({ theme }) => theme.overlay};
  color: ${({ theme }) => theme.text2};
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
`;

export const Text = styled.div`
  font-size: 16px;
  line-height: 1.7;
  color: ${({ theme }) => theme.text};
  margin-bottom: 24px;
  max-width: 820px;
`;

export const OptionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 820px;
`;

// Sticky action bar pinned to the bottom of the scrolling main column. The
// negative horizontal margins cancel Main's side padding so the bar bleeds
// full-width; Main has no bottom padding, so `bottom: 0` sits flush against the
// viewport edge, matching the Figma design.
export const ActionRow = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 24px -16px 0;
  padding: 12px 16px;
  background: rgba(14, 17, 23, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid ${({ theme }) => theme.hairline};

  @media (min-width: 768px) {
    margin: 28px -32px 0;
    padding: 14px 30px;
  }
`;

export const Spacer = styled.div`
  flex: 1;
`;

// Secondary nav control (Prev). Shared by the link and its disabled span form.
const navBase = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.overlay};
  border: 1px solid ${({ theme }) => theme.hairlineStrong};
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
  text-decoration: none;
`;

export const PrevButton = styled.button`
  ${navBase}
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.accent2};
  }
`;

export const PrevDisabled = styled.span`
  ${navBase}
  opacity: 0.4;
  cursor: default;
`;

// Left-side secondary action: spin up a fresh mock exam without leaving the
// question. Shares the quiet nav look so it doesn't compete with Submit/Next.
export const GenerateTestButton = styled.button`
  ${navBase}
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.accent2};
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* On a phone the icon carries the action; drop the longer label. */
  @media (max-width: 520px) {
    span {
      display: none;
    }
  }
`;

// Sibling to GenerateTestButton: clear the open test's results and restart it.
// Shares the quiet nav look so it stays secondary alongside Generate.
export const ResetTestButton = styled(GenerateTestButton)``;

// Sibling control: clear only the test's wrong answers to re-attempt them.
export const RetryFailedButton = styled(GenerateTestButton)``;

// Primary control — Submit (unanswered) and Next (answered) share this look.
const primaryBase = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.accent};
  color: #0e1117;
  border: none;
  border-radius: 7px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

export const SubmitButton = styled.button`
  ${primaryBase}

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

export const NextButton = styled.button`
  ${primaryBase}
`;

export const ResultBadge = styled.div<{ $result: "correct" | "wrong" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 7px;
  background: ${({ $result }) =>
    $result === "correct"
      ? "rgba(34, 197, 94, 0.12)"
      : "rgba(232, 64, 64, 0.12)"};
  color: ${({ theme, $result }) =>
    $result === "correct" ? theme.green : theme.red};
  border: 1px solid
    ${({ $result }) =>
      $result === "correct"
        ? "rgba(34, 197, 94, 0.3)"
        : "rgba(232, 64, 64, 0.3)"};
`;
