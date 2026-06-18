import { Form } from "react-router";

import { signOutClient } from "~/lib/firebase.client";
import {
  Bar,
  Logo,
  TitleBlock,
  ScoreBar,
  Pill,
  ProgressOuter,
  ProgressInner,
  UserBadge,
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
}

export default function Header({ correct, wrong, total, user }: HeaderProps) {
  const answered = correct + wrong;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <Bar>
      <Logo>AWS</Logo>
      <TitleBlock>
        <h1>SAA-C03 Quiz</h1>
        <span>AWS Solutions Architect Associate</span>
      </TitleBlock>

      <ScoreBar>
        <Pill $variant="correct">
          <span>✓</span>
          <span className="num">{correct}</span>
        </Pill>
        <Pill $variant="wrong">
          <span>✗</span>
          <span className="num">{wrong}</span>
        </Pill>
        <Pill $variant="total">
          <span className="num">{answered}</span>
          <span>/ {total}</span>
        </Pill>

        <ProgressOuter>
          <ProgressInner $pct={pct} />
        </ProgressOuter>

        <UserBadge>
          {user.photoURL ? <img src={user.photoURL} alt="" /> : null}
          <span className="user-name">{user.name}</span>
          <Form method="post" action="/logout" onSubmit={() => void signOutClient()}>
            <SignOutButton type="submit">sign out</SignOutButton>
          </Form>
        </UserBadge>
      </ScoreBar>
    </Bar>
  );
}
