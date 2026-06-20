import styled from "styled-components";

/** Scrollable viewport — the only element that scrolls. */
export const Viewport = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* Keep the scroll fully contained — don't chain to the page. */
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 4px;
  }
`;

/** Full-height sizer that gives the scrollbar the true content extent. */
export const Spacer = styled.div`
  position: relative;
  width: 100%;
`;

/** Absolutely positioned row; `top`/`height` are set inline per index. */
export const Row = styled.div`
  position: absolute;
  left: 0;
  right: 0;
`;
