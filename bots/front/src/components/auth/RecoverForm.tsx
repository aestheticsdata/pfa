"use client";

import AuthField from "@components/auth/AuthField";
import AuthSubmit from "@components/auth/AuthSubmit";
import AuthTitle from "@components/auth/AuthTitle";
import MessageBox from "@components/auth/MessageBox";
import { MESSAGE_KIND } from "@components/auth/messageKind";
import { recover } from "@lib/auth/authActions";
import { AUTH_TEXT } from "@text/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

/** After a reset, the success line stays this long before the operator is sent to sign in. */
const DONE_DELAY_MS = 1800;

/** Recovery, by direct URL only: email + passphrase + new password. */
const RecoverForm = () => {
  const [state, action, pending] = useActionState(recover, { fields: {}, message: null, done: false, email: "" });
  const router = useRouter();

  useEffect(() => {
    if (!state.done) return;
    const timer = setTimeout(() => router.push("/signin?reset=1"), DONE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.done, router]);

  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-5"
      data-testid="recover-form"
    >
      <AuthTitle title={AUTH_TEXT.recover.title} />
      {state.done ? (
        <MessageBox kind={MESSAGE_KIND.ok}>{AUTH_TEXT.recover.done}</MessageBox>
      ) : (
        <>
          {state.message && <MessageBox kind={MESSAGE_KIND.error}>{state.message}</MessageBox>}
          <AuthField
            label={AUTH_TEXT.fields.email}
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={state.email}
            error={state.fields.email}
          />
          <AuthField
            label={AUTH_TEXT.fields.passphrase}
            name="recoveryPassphrase"
            secret
            autoComplete="off"
            error={state.fields.recoveryPassphrase}
          />
          <AuthField
            label={AUTH_TEXT.fields.newPassword}
            name="newPassword"
            secret
            autoComplete="new-password"
            error={state.fields.newPassword}
            hint={AUTH_TEXT.setup.passwordHint}
          />
          <AuthSubmit disabled={pending}>{AUTH_TEXT.recover.submit}</AuthSubmit>
        </>
      )}
      <Link
        href="/signin"
        className="min-h-10 self-center text-body text-muted underline underline-offset-2 hover:text-text tablet:min-h-0"
      >
        {AUTH_TEXT.recover.back}
      </Link>
    </form>
  );
};

export default RecoverForm;
