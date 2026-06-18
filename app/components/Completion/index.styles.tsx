import styled from "styled-components";

export const Wrap = styled.div`
  text-align: center;
  padding: 60px 20px;
  max-width: 600px;
  margin: 0 auto;

  h2 {
    font-size: 28px;
    margin-bottom: 12px;
    color: ${({ theme }) => theme.accent};
  }
  p {
    color: ${({ theme }) => theme.text2};
    font-size: 16px;
    margin-bottom: 32px;
  }
`;

export const FinalScore = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 36px;
`;

export const Stat = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 20px 32px;
  text-align: center;

  .lbl {
    font-size: 12px;
    color: ${({ theme }) => theme.text2};
    margin-top: 4px;
  }
`;

export const Val = styled.div<{ $tone: "green" | "red" | "accent" }>`
  font-size: 36px;
  font-weight: 800;
  color: ${({ theme, $tone }) => theme[$tone]};
`;

export const RestartButton = styled.button`
  background: ${({ theme }) => theme.accent};
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 13px 32px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
`;
