import { Link } from "react-router";
import styled from "styled-components";

export const Bar = styled.header`
  background: ${({ theme }) => theme.headerBg};
  border-bottom: 1px solid ${({ theme }) => theme.hairline};
  padding: 11px 15px;
  display: flex;
  align-items: center;
  gap: 11px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
`;

// Opens the question-list drawer; only shown on mobile, where the Sidebar is
// off-canvas. Hidden from the tablet breakpoint up, where the rail is static.
export const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  padding: 0;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  flex-shrink: 0;

  @media (min-width: 768px) {
    display: none;
  }
`;

// Branding cluster: icon mark + "AWS Prep" wordmark + exam badge.
export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
`;

export const Logo = styled.div`
  width: 24px;
  height: 24px;
  background: ${({ theme }) => theme.accent};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  flex-shrink: 0;
`;

export const Wordmark = styled.span`
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: ${({ theme }) => theme.text};
`;

export const ExamBadge = styled.span`
  background: rgba(255, 153, 0, 0.1);
  color: ${({ theme }) => theme.accent};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;

  /* Declutter the mobile header — the exam name is implied by the app. */
  @media (max-width: 640px) {
    display: none;
  }
`;

// Returns to the full question bank (the quiz). Ghost styling keeps it quiet
// next to the brand; the label collapses to the icon on small screens.
export const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  border-radius: 6px;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.text2};
  text-decoration: none;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.hairline};
  }

  @media (max-width: 640px) {
    padding: 6px;
    span {
      display: none;
    }
  }
`;

// Groups the test actions (generate + open-latest) so they sit together.
export const TestActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

// Opens the most recently generated test. Square icon-only sibling to the
// Generate button, sharing its outlined-accent look.
export const LatestTestLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.accent};
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 153, 0, 0.1);
  }
`;

// Assembles a fresh mock exam. Outlined accent pill so it reads as an action
// without competing with the brand. The label collapses to the icon on phones.
export const GenerateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.accent};
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 6px;
  padding: 6px 11px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(255, 153, 0, 0.1);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  /* On a phone the icon alone carries the action; drop the label. */
  @media (max-width: 520px) {
    padding: 6px;
    span {
      display: none;
    }
  }
`;

export const ScoreBar = styled.div`
  margin-left: auto;
  display: flex;
  gap: 11px;
  align-items: center;
`;

export const Answered = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 11px;
  color: ${({ theme }) => theme.textMono};
  white-space: nowrap;

  /* The exact count is secondary on a phone; keep the pills, drop the text. */
  @media (max-width: 520px) {
    display: none;
  }
`;

// Auth lives in the design's whitespace — the avatar is the only persistent
// affordance; the sign-out action is tucked into a dropdown so the header stays
// uncluttered, especially on mobile.
export const UserMenu = styled.div`
  position: relative;
  padding-left: 11px;
  border-left: 1px solid ${({ theme }) => theme.hairline};
`;

export const UserTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.text2};

  img,
  .avatar-fallback {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.accent};
    color: #000;
    font-size: 12px;
    font-weight: 600;
  }

  .user-name {
    font-size: 12px;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    /* On a phone the avatar alone is enough — the name lives in the dropdown. */
    @media (max-width: 640px) {
      display: none;
    }
  }
`;

// Desktop: a compact dropdown anchored under the avatar.
// Mobile: promotes to a full-screen modal so the menu is easy to tap and read.
export const UserDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: ${({ theme }) => theme.headerBg};
  border: 1px solid ${({ theme }) => theme.hairline};
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  z-index: 200;

  @media (max-width: 640px) {
    position: fixed;
    inset: 0;
    top: 0;
    min-width: 0;
    border: none;
    border-radius: 0;
    padding: 16px;
    gap: 8px;
    box-shadow: none;
    z-index: 1000;
  }
`;

// Holds the account name and the close button. The close button only matters in
// the mobile full-screen modal; on desktop the header collapses to just the name.
export const DropdownHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.hairline};
  margin-bottom: 2px;

  @media (max-width: 640px) {
    padding-bottom: 12px;
    margin-bottom: 8px;
  }
`;

// Shows the full account name inside the menu — the trigger hides it on mobile.
export const DropdownName = styled.div`
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.textMono};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 640px) {
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }
`;

// Only visible in the mobile full-screen modal.
export const DropdownClose = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  color: ${({ theme }) => theme.text};
  cursor: pointer;

  @media (max-width: 640px) {
    display: flex;
  }
`;

export const SignOutButton = styled.button`
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-radius: 4px;
  color: ${({ theme }) => theme.accent2};
  cursor: pointer;
  font-size: 13px;
  padding: 8px 10px;

  &:hover {
    background: ${({ theme }) => theme.hairline};
  }

  @media (max-width: 640px) {
    font-size: 16px;
    padding: 14px 12px;
    border: 1px solid ${({ theme }) => theme.hairline};
  }
`;
