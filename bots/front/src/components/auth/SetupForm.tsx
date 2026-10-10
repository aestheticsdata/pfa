"use client";

import AuthField from "@components/auth/AuthField";
import AuthSubmit from "@components/auth/AuthSubmit";
import AuthTitle from "@components/auth/AuthTitle";
import MessageBox from "@components/auth/MessageBox";
import { MESSAGE_KIND } from "@components/auth/messageKind";
import { setup } from "@lib/auth/authActions";
import { AUTH_TEXT } from "@text/auth";
import { useActionState } from "react";

/** First run: creates the one admin account, then signs it in. */
const SetupForm = () => {
  const [state, action, pending] = useActionState(setup, { fields: {}, message: null, email: "" });
  const { fields } = state;
  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-5"
      data-testid="setup-form"
    >
      <AuthTitle
        title={AUTH_TEXT.setup.title}
        message={state.message}
      />
      <p className="m-0 -mt-3 text-body text-muted">{AUTH_TEXT.setup.lead}</p>
      <AuthField
        label={AUTH_TEXT.fields.email}
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.email}
        error={fields.email}
      />
      <AuthField
        label={AUTH_TEXT.fields.password}
        name="password"
        type="password"
        autoComplete="new-password"
        error={fields.password}
        hint={AUTH_TEXT.setup.passwordHint}
      />
      <AuthField
        label={AUTH_TEXT.fields.confirm}
        name="confirm"
        type="password"
        autoComplete="new-password"
        error={fields.confirm}
      />
      <AuthField
        label={AUTH_TEXT.fields.passphrase}
        name="recoveryPassphrase"
        autoComplete="off"
        error={fields.recoveryPassphrase}
      />
      <MessageBox kind={MESSAGE_KIND.warn}>{AUTH_TEXT.setup.keepSafe}</MessageBox>
      <AuthSubmit disabled={pending}>{AUTH_TEXT.setup.submit}</AuthSubmit>
    </form>
  );
};

export default SetupForm;
