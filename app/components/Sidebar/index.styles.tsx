import { Link } from "react-router";
import styled from "styled-components";

export const Aside = styled.aside<{ $open: boolean }>`
  width: 280px;
  max-width: 85vw;
  background: ${({ theme }) => theme.bg};
  border-right: 1px solid ${({ theme }) => theme.hairline};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  min-height: 0;

  /* Mobile-first: off-canvas drawer that slides in over the content. */
  position: fixed;
  top: 0;
  left: 0;
  height: 100dvh;
  z-index: 200;
  transform: translateX(${({ $open }) => ($open ? "0" : "-100%")});
  transition: transform 0.25s ease;

  /* Tablet/desktop: static rail inside the layout grid. */
  @media (min-width: 768px) {
    position: static;
    height: auto;
    max-width: none;
    z-index: auto;
    transform: none;
  }
`;

// The fixed top of the rail: heading, score boxes, search and filters.
export const HeadBlock = styled.div`
  padding: 15px;
  border-bottom: 1px solid ${({ theme }) => theme.hairline};
  display: flex;
  flex-direction: column;
  gap: 11px;
  flex-shrink: 0;
`;

export const HeadRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

export const Titles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;

  .kicker {
    font-family: ${({ theme }) => theme.fontMono};
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.textMono};
  }
  h2 {
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }
`;

// Closes the drawer on mobile; the static desktop rail has no close affordance.
export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  color: ${({ theme }) => theme.text2};
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.text};
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

export const Stats = styled.div`
  display: flex;
  gap: 7px;
`;

export const Stat = styled.div<{ $variant: "correct" | "wrong" | "total" }>`
  flex: 1;
  min-width: 0;
  border-radius: 4px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  background: ${({ $variant }) =>
    $variant === "correct"
      ? "rgba(34, 197, 94, 0.1)"
      : $variant === "wrong"
        ? "rgba(232, 64, 64, 0.1)"
        : "rgba(255, 153, 0, 0.1)"};

  .label {
    font-family: ${({ theme }) => theme.fontMono};
    font-size: 11px;
    color: ${({ theme }) => theme.textMono};
  }
  .value {
    font-family: ${({ theme }) => theme.fontMono};
    font-weight: 600;
    font-size: 15px;
    color: ${({ theme, $variant }) =>
      $variant === "correct"
        ? theme.green
        : $variant === "wrong"
          ? theme.red
          : theme.accent};
  }
`;

export const Search = styled.div`
  position: relative;

  .search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.textMono};
    pointer-events: none;
  }

  input {
    width: 100%;
    background: ${({ theme }) => theme.overlay};
    border: 1px solid ${({ theme }) => theme.hairlineStrong};
    border-radius: 4px;
    padding: 7px 10px 7px 31px;
    color: ${({ theme }) => theme.text};
    font-size: 12px;
    outline: none;

    &:focus {
      border-color: ${({ theme }) => theme.accent2};
    }
    &::placeholder {
      color: ${({ theme }) => theme.textMono};
    }
  }
`;

export const FilterRow = styled.div`
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
`;

export const FilterButton = styled.button<{ $active: boolean }>`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 10px;
  padding: 3px 9px;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.accent : theme.hairlineStrong)};
  border-radius: 20px;
  background: ${({ theme, $active }) =>
    $active ? theme.accent : "transparent"};
  color: ${({ theme, $active }) => ($active ? "#000" : theme.textMono)};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme, $active }) =>
      $active ? theme.accent : theme.accent2};
    color: ${({ theme, $active }) => ($active ? "#000" : theme.text)};
  }
`;

// Scroll region for the virtualized question list. Must be a flex container so
// the VirtualizedList Viewport's `flex: 1; min-height: 0` resolves to a bounded
// height — otherwise the Viewport grows to its full content height, its measured
// clientHeight equals the whole canvas, and every row paints at once.
export const ListWrap = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

/** Fixed row height — must stay in sync with the value passed to VirtualizedList. */
export const ITEM_HEIGHT = 76;

export const Empty = styled.div`
  padding: 16px 15px;
  font-size: 12px;
  color: ${({ theme }) => theme.text2};
`;

export const Item = styled(Link)<{ $active: boolean }>`
  height: 100%;
  box-sizing: border-box;
  padding: 11px 15px;
  border-bottom: 1px solid ${({ theme }) => theme.hairline};
  border-left: 2px solid
    ${({ theme, $active }) => ($active ? theme.accent : "transparent")};
  cursor: pointer;
  transition: background 0.1s;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  text-decoration: none;
  background: ${({ $active }) =>
    $active ? "rgba(255, 153, 0, 0.04)" : "transparent"};

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? "rgba(255, 153, 0, 0.04)" : theme.overlaySoft};
  }

  .status {
    flex-shrink: 0;
    margin-top: 1px;
    display: flex;
    color: ${({ theme }) => theme.textMono};
  }
  .mid {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .q-num {
    font-family: ${({ theme }) => theme.fontMono};
    font-weight: 500;
    font-size: 11px;
    color: ${({ theme, $active }) => ($active ? theme.accent : theme.textMono)};
  }
  .q-preview {
    font-size: 12px;
    line-height: 1.45;
    color: ${({ theme, $active }) => ($active ? theme.text : theme.text2)};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .chevron {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ theme }) => theme.accent};
    display: flex;
  }
`;

/** Stand-in row shown while a window's data is being fetched. */
export const Placeholder = styled.div`
  height: 100%;
  box-sizing: border-box;
  padding: 11px 15px;
  border-bottom: 1px solid ${({ theme }) => theme.hairline};
  border-left: 2px solid transparent;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  opacity: 0.5;

  .status {
    flex-shrink: 0;
    margin-top: 1px;
    display: flex;
    color: ${({ theme }) => theme.textMono};
  }
  .mid {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .q-num {
    font-family: ${({ theme }) => theme.fontMono};
    font-weight: 500;
    font-size: 11px;
    color: ${({ theme }) => theme.textMono};
  }
  .q-bar {
    height: 8px;
    border-radius: 4px;
    background: ${({ theme }) => theme.hairlineStrong};
  }
`;

// Bottom-of-rail progress readout (moved out of the header per the design).
export const Footer = styled.div`
  padding: 12px 15px;
  border-top: 1px solid ${({ theme }) => theme.hairline};
  flex-shrink: 0;
`;

export const FooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .label {
    font-size: 13px;
    color: ${({ theme }) => theme.text2};
  }
  .count {
    font-family: ${({ theme }) => theme.fontMono};
    font-size: 11px;
    color: ${({ theme }) => theme.textMono};
  }
`;

export const Track = styled.div`
  height: 3px;
  border-radius: 4px;
  background: ${({ theme }) => theme.overlay};
  overflow: hidden;
`;

export const Fill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme }) => theme.accent};
  border-radius: 4px;
  transition: width 0.4s ease;
`;
