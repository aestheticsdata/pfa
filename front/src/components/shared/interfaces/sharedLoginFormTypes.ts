// What `SharedLoginForm` hands to its `onSubmit`. Every field is present: the
// form renders a subset of the inputs depending on the mode, but the hidden ones
// still carry their "" default, so callers never have to assert (COS-109).
export interface LoginValues {
  currency: string;
  email: string;
  password: string;
}

export interface SharedLoginFormProps {
  onSubmit: (values: LoginValues) => Promise<void>;
  buttonTitle: string;
  displayEmailField?: boolean;
  displayPasswordField?: boolean;
  displayConfirmPasswordField?: boolean;
  displayCurrencyField?: boolean;
  /** Show a trailing arrow on the submit button (login). */
  submitIcon?: boolean;
  /** Form-level server error rendered above the submit button (e.g. bad credentials). */
  serverError?: string | null;
  /** Called when the user edits email/password, so the parent can clear serverError. */
  onDismissError?: () => void;
  /** Disables every field and the submit button while leaving the form in place (COS-419). */
  disabled?: boolean;
}
