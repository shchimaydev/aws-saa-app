import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 20, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Modal = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 48px 40px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

export const Logo = styled.div`
  width: 56px;
  height: 56px;
  background: ${({ theme }) => theme.accent};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
  color: #000;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
`;

export const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
`;

export const Lead = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.text2};
  line-height: 1.5;
  max-width: 280px;
`;

export const ErrorText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.red};
  min-height: 18px;
`;
