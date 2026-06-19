import styled from "styled-components";

// Pins the quiz UI to the viewport so the Sidebar and Main scroll
// independently rather than the whole page. dvh handles mobile browser chrome.
export const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
`;

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  /* Fill the space left under the (flex-shrink:0) Header without hard-coding
     its height; min-height:0 lets the Sidebar/Main scroll containers shrink. */
  flex: 1;
  min-height: 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Main = styled.div`
  overflow-y: auto;
  padding: 28px 32px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;
