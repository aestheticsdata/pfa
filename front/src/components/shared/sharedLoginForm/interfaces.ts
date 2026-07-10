export interface LoginValues {
  currency?: string;
  email?: string;
  password?: string;
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
}
