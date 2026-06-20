import { Link } from "react-router";
import styled from "styled-components";

export const Aside = styled.aside`
  width: 280px;
  background: ${({ theme }) => theme.surface};
  border-right: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  min-height: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const SectionHeader = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 11px;
  color: ${({ theme }) => theme.text2};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
`;

export const Search = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-shrink: 0;

  input {
    width: 100%;
    background: ${({ theme }) => theme.surface2};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    padding: 7px 10px;
    color: ${({ theme }) => theme.text};
    font-size: 12px;
    outline: none;

    &:focus {
      border-color: ${({ theme }) => theme.accent2};
    }
    &::placeholder {
      color: ${({ theme }) => theme.text2};
    }
  }
`;

export const FilterRow = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

export const FilterButton = styled.button<{ $active: boolean }>`
  font-size: 10px;
  padding: 3px 8px;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.accent : theme.border)};
  border-radius: 20px;
  background: ${({ theme, $active }) => ($active ? theme.accent : "transparent")};
  color: ${({ theme, $active }) => ($active ? "#000" : theme.text2)};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.accent2};
    color: ${({ theme, $active }) => ($active ? "#000" : theme.text)};
  }
`;

/** Fixed row height — must stay in sync with the value passed to VirtualizedList. */
export const ITEM_HEIGHT = 38;

export const Empty = styled.div`
  padding: 16px 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.text2};
`;

export const Item = styled(Link)<{ $active: boolean }>`
  height: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;
  transition: background 0.1s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  text-decoration: none;
  background: ${({ theme, $active }) => ($active ? theme.surface2 : "transparent")};
  border-left: ${({ theme, $active }) =>
    $active ? `3px solid ${theme.accent}` : "3px solid transparent"};

  &:hover {
    background: ${({ theme }) => theme.surface2};
  }

  .q-num {
    font-weight: 700;
    color: ${({ theme }) => theme.text2};
    min-width: 28px;
    font-size: 11px;
  }
  .q-preview {
    color: ${({ theme }) => theme.text2};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
`;

/** Stand-in row shown while a window's data is being fetched. */
export const Placeholder = styled.div`
  height: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  opacity: 0.5;

  .q-num {
    font-weight: 700;
    color: ${({ theme }) => theme.text2};
    min-width: 28px;
    font-size: 11px;
  }
  .q-bar {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: ${({ theme }) => theme.border};
  }
`;

export const Dot = styled.span<{ $result: "correct" | "wrong" | null }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $result }) =>
    $result === "correct"
      ? theme.green
      : $result === "wrong"
        ? theme.red
        : theme.border};
`;
