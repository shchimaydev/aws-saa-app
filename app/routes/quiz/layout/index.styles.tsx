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
  /* Mobile-first: single column; the Sidebar overlays as a drawer. The static
     280px rail appears from the tablet breakpoint up. min-height:0 lets the
     Sidebar/Main scroll containers shrink under the (flex-shrink:0) Header. */
  grid-template-columns: 1fr;
  flex: 1;
  min-height: 0;

  @media (min-width: 768px) {
    grid-template-columns: 280px 1fr;
  }
`;

export const Main = styled.div`
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 4px;
  }

  @media (min-width: 768px) {
    padding: 28px 32px;
  }
`;

// Scrim behind the off-canvas Sidebar drawer on mobile. Desktop keeps the rail
// static, so the backdrop never shows there.
export const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 150;
  background: rgba(0, 0, 0, 0.55);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
  transition:
    opacity 0.25s ease,
    visibility 0.25s ease;

  @media (min-width: 768px) {
    display: none;
  }
`;
