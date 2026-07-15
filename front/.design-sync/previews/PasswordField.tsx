import { PasswordField } from "pfa-next";

/**
 * `registration` is a react-hook-form `UseFormRegisterReturn`, spread onto the input.
 * A static preview has no form context, so this is the inert equivalent.
 */
const registration = (name: string) => ({
  name,
  onChange: async () => {},
  onBlur: async () => {},
  ref: () => {},
});

export const Base = () => (
  <div className="w-72">
    <PasswordField
      id="pw-base"
      label="Mot de passe"
      autoComplete="current-password"
      invalid={false}
      registration={registration("password")}
    />
  </div>
);

export const Invalid = () => (
  <div className="w-72">
    <PasswordField
      id="pw-invalid"
      label="Mot de passe"
      autoComplete="current-password"
      invalid
      registration={registration("password")}
    />
  </div>
);

export const SignupForm = () => (
  <div className="flex w-72 flex-col gap-4">
    <PasswordField
      id="pw-new"
      label="Mot de passe"
      autoComplete="new-password"
      invalid={false}
      registration={registration("password")}
    />
    <PasswordField
      id="pw-confirm"
      label="Confirmer le mot de passe"
      autoComplete="new-password"
      invalid
      registration={registration("passwordConfirmation")}
    />
  </div>
);
