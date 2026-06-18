import { useEffect, useState } from "react";
import { redirect, useFetcher } from "react-router";
import styled from "styled-components";

import type { Route } from "./+types/login";
import { getUserId } from "~/lib/session.server";
import { signInWithGoogle } from "~/lib/firebase.client";
import LoginButton from "~/components/LoginButton";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Sign in — AWS SAA Quiz" }];
}

// Already signed in? Skip the login screen.
export async function loader({ request }: Route.LoaderArgs) {
  const uid = await getUserId(request);
  if (uid) throw redirect("/quiz/1");
  return null;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 20, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 48px 40px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Logo = styled.div`
  width: 56px;
  height: 56px;
  background: ${({ theme }) => theme.accent};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
  color: #000;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
`;

const Lead = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.text2};
  line-height: 1.5;
  max-width: 280px;
`;

const ErrorText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.red};
  min-height: 18px;
`;

export default function Login() {
  const fetcher = useFetcher<{ error?: string }>();
  const [error, setError] = useState<string | null>(null);
  // While the popup is open or the token is being exchanged.
  const [popupBusy, setPopupBusy] = useState(false);
  const busy = popupBusy || fetcher.state !== "idle";

  // Surface server-side errors from the /auth/session action.
  useEffect(() => {
    if (fetcher.data?.error) {
      setError(fetcher.data.error);
      setPopupBusy(false);
    }
  }, [fetcher.data]);

  async function handleSignIn() {
    setError(null);
    setPopupBusy(true);
    try {
      const idToken = await signInWithGoogle();
      // Exchange the ID token for a session cookie; the action redirects on success.
      fetcher.submit({ idToken }, { method: "post", action: "/auth/session" });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      // User dismissing the Google popup isn't worth shouting about.
      const cancelled = ["popup_closed", "user_cancel", "auth/popup-closed-by-user"].includes(code);
      if (!cancelled) {
        setError("Sign-in failed. Please try again.");
      }
      setPopupBusy(false);
    }
  }

  return (
    <Overlay>
      <Modal>
        <Logo>AWS</Logo>
        <Title>SAA-C03 Quiz</Title>
        <Lead>Sign in to save and sync your progress across all your devices.</Lead>
        <LoginButton onClick={handleSignIn} disabled={busy} />
        <ErrorText>{error}</ErrorText>
      </Modal>
    </Overlay>
  );
}
