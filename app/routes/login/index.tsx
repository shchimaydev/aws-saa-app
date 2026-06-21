import { useEffect, useState } from "react";
import { redirect, useFetcher } from "react-router";

import type { Route } from "./+types/index";
import { getUserId } from "~/lib/session.server";
import { signInWithGoogle } from "~/lib/firebase.client";
import LoginButton from "~/components/LoginButton";
import { Overlay, Modal, Logo, Title, Lead, ErrorText } from "./index.styles";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Sign in — AWS SAA Quiz" }];
}

// Already signed in? Skip the login screen.
export async function loader({ request }: Route.LoaderArgs) {
  const uid = await getUserId(request);
  if (uid) throw redirect("/quiz/1");
  return null;
}

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
      const cancelled = [
        "popup_closed",
        "user_cancel",
        "auth/popup-closed-by-user",
      ].includes(code);
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
        <Lead>
          Sign in to save and sync your progress across all your devices.
        </Lead>
        <LoginButton onClick={handleSignIn} disabled={busy} />
        <ErrorText>{error}</ErrorText>
      </Modal>
    </Overlay>
  );
}
