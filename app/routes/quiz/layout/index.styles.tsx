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
  /* No bottom padding: a scroll container's padding-bottom shrinks the sticky
     containment rect, which would park QuestionCard's sticky ActionRow above
     the real bottom. Routes own their own bottom spacing instead. */
  padding: 16px 16px 0;
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 4px;
  }

  @media (min-width: 768px) {
    padding: 28px 32px 0;
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
