import styled from "styled-components";

export const Bar = styled.header`
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const Logo = styled.div`
  width: 34px;
  height: 34px;
  background: ${({ theme }) => theme.accent};
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 12px;
  color: #000;
  flex-shrink: 0;
  letter-spacing: -0.5px;
`;

export const TitleBlock = styled.div`
  h1 {
    font-size: 15px;
    font-weight: 700;
  }
  span {
    font-size: 12px;
    color: ${({ theme }) => theme.text2};
  }
`;

export const ScoreBar = styled.div`
  margin-left: auto;
  display: flex;
  gap: 6px;
  align-items: center;
`;

export const Pill = styled.div<{ $variant: "correct" | "wrong" | "total" }>`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 13px;

  border-color: ${({ theme, $variant }) =>
    $variant === "correct"
      ? theme.green
      : $variant === "wrong"
        ? theme.red
        : theme.accent};

  .num {
    font-weight: 700;
    font-size: 16px;
    color: ${({ theme, $variant }) =>
      $variant === "correct"
        ? theme.green
        : $variant === "wrong"
          ? theme.red
          : theme.accent};
  }
`;

export const ProgressOuter = styled.div`
  flex: 1;
  max-width: 160px;
  background: ${({ theme }) => theme.surface2};
  border-radius: 4px;
  height: 6px;
  overflow: hidden;
`;

export const ProgressInner = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme }) => theme.accent};
  border-radius: 4px;
  transition: width 0.4s ease;
`;

export const UserBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
  padding: 4px 12px 4px 4px;
  font-size: 13px;

  img {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-name {
    color: ${({ theme }) => theme.text2};
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const SignOutButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.accent2};
  cursor: pointer;
  font-size: 12px;
  padding: 0;
`;
