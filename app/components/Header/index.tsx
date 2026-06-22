import { useEffect, useRef, useState } from "react";
import { Form, useNavigation } from "react-router";
import { History, House, ListChecks, Layers, Menu, X } from "lucide-react";

import { signOutClient } from "~/lib/firebase/firebase.client";
import {
  Bar,
  MenuButton,
  Brand,
  Logo,
  Wordmark,
  ExamBadge,
  HomeLink,
  TestActions,
  LatestTestLink,
  GenerateButton,
  ScoreBar,
  Answered,
  UserMenu,
  UserTrigger,
  UserDropdown,
  DropdownHeader,
  DropdownName,
  DropdownClose,
  SignOutButton,
} from "./index.styles";

export interface HeaderUser {
  name: string;
  photoURL: string;
}

interface HeaderProps {
  correct: number;
  wrong: number;
  total: number;
  user: HeaderUser;
  onMenuClick?: () => void;
}

export default function Header({
  correct,
  wrong,
  total,
  user,
  onMenuClick,
}: HeaderProps) {
  const answered = correct + wrong;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Scope the pending label to *this* form so unrelated navigations don't
  // flip the button to "Generating…".
  const navigation = useNavigation();
  const generating = navigation.formAction === "/test/generate";

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <Bar>
      <MenuButton
        type="button"
        aria-label="Open question list"
        onClick={onMenuClick}
      >
        <Menu size={20} />
      </MenuButton>

      <Brand>
        <Logo>
          <Layers size={14} />
        </Logo>
        <Wordmark>AWS Prep</Wordmark>
        <ExamBadge>SAA-C03</ExamBadge>
      </Brand>

      <HomeLink to="/" prefetch="intent">
        <House size={14} />
        <span>Home</span>
      </HomeLink>

      <TestActions>
        <Form method="post" action="/test/generate">
          <GenerateButton type="submit" disabled={generating}>
            <ListChecks size={14} />
            <span>{generating ? "Generating…" : "Generate Test"}</span>
          </GenerateButton>
        </Form>
        <LatestTestLink
          to="/test"
          aria-label="Open latest test"
          title="Open latest test"
        >
          <History size={15} />
        </LatestTestLink>
      </TestActions>

      <ScoreBar>
        <Answered>
          {answered}/{total} answered
        </Answered>

        <UserMenu ref={menuRef}>
          <UserTrigger
            type="button"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              <span className="avatar-fallback">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="user-name">{user.name}</span>
          </UserTrigger>

          {menuOpen ? (
            <UserDropdown role="menu">
              <DropdownHeader>
                <DropdownName>{user.name}</DropdownName>
                <DropdownClose
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                >
                  <X size={20} />
                </DropdownClose>
              </DropdownHeader>
              <Form
                method="post"
                action="/logout"
                onSubmit={() => void signOutClient()}
              >
                <SignOutButton type="submit" role="menuitem">
                  Sign out
                </SignOutButton>
              </Form>
            </UserDropdown>
          ) : null}
        </UserMenu>
      </ScoreBar>
    </Bar>
  );
}
