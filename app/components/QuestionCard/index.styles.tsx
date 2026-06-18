import { Link } from "react-router";
import styled from "styled-components";

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
`;

export const Badge = styled.span<{ $multi?: boolean }>`
  background: ${({ theme, $multi }) => ($multi ? theme.accent2 : theme.accent)};
  color: ${({ $multi }) => ($multi ? "#fff" : "#000")};
  font-weight: 800;
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 12px;
  letter-spacing: 0.03em;
`;

export const Position = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text2};
`;

export const Text = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: ${({ theme }) => theme.text};
  margin-bottom: 24px;
  max-width: 820px;
`;

export const OptionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 820px;
  margin-bottom: 24px;
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 10px;
  max-width: 820px;
`;

export const SubmitButton = styled.button`
  background: ${({ theme }) => theme.accent};
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 11px 24px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.88;
  }
  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

export const NextLink = styled(Link)`
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 11px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s;
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.accent2};
  }
`;

export const ResultBadge = styled.div<{ $result: "correct" | "wrong" }>`
  font-size: 14px;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 8px;
  background: ${({ theme, $result }) =>
    $result === "correct" ? theme.greenBg : theme.redBg};
  color: ${({ theme, $result }) =>
    $result === "correct" ? theme.green : theme.red};
  border: 1px solid
    ${({ theme, $result }) => ($result === "correct" ? theme.green : theme.red)};
`;
