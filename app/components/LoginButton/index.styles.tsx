import styled from "styled-components";

// White Google button ported from legacy #google-signin-btn.
export const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  color: #1f1f1f;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: box-shadow 0.2s;

  &:hover:not(:disabled) {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  svg {
    flex-shrink: 0;
  }
`;
