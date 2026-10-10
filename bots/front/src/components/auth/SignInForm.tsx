"use client";

import AuthField from "@components/auth/AuthField";
import AuthSubmit from "@components/auth/AuthSubmit";
import AuthTitle from "@components/auth/AuthTitle";
import { MESSAGE_KIND } from "@components/auth/messageKind";
import useNow from "@components/hooks/useNow";
import { signIn } from "@lib/auth/authActions";
import { AUTH_TEXT } from "@text/auth";
import { useActionState } from "react";

import type { SignInFormProps } from "@components/auth/interfaces/authFormProps";

/** Sign in: email, password, `[ sign in ]`. Nothing links to recovery or to a sign-up. */
const SignInForm = ({ notice, next }: SignInFormProps) => {
  const [state, action, pending] = useActionState(signIn, { message: null, lockedUntil: null, email: "" });
  const now = useNow(state.lockedUntil ? 1000 : null);
  const locked = state.lockedUntil !== null && state.lockedUntil > now;
  const minutes = locked && state.lockedUntil ? Math.ceil((state.lockedUntil - now) / 60_000) : 0;

  const message = locked ? AUTH_TEXT.signIn.tooMany(minutes) : (state.message ?? notice);
  const kind = locked || state.message ? MESSAGE_KIND.error : MESSAGE_KIND.info;

  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-5"
      data-testid="signin-form"
    >
      <AuthTitle
        title={AUTH_TEXT.signIn.title}
        message={message}
        kind={kind}
      />
      <input
        type="hidden"
        name="next"
        value={next}
      />
      <AuthField
        label={AUTH_TEXT.fields.email}
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.email}
      />
      <AuthField
        label={AUTH_TEXT.fields.password}
        name="password"
        secret
        autoComplete="current-password"
      />
      <AuthSubmit disabled={locked || pending}>{AUTH_TEXT.signIn.submit}</AuthSubmit>
      <p className="m-0 mt-1.5 text-center font-mono text-xs text-dim">{AUTH_TEXT.signIn.hint}</p>
    </form>
  );
};

export default SignInForm;
