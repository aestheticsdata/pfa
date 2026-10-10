/** What the sign-in form shows after an attempt. */
export interface SignInState {
  message: string | null;
  /** Rate limited until this instant (epoch ms): the button stays disabled, the minutes count down. */
  lockedUntil: number | null;
  email: string;
}

export interface SetupState {
  fields: Record<string, string>;
  message: string | null;
  email: string;
}

export interface RecoverState {
  fields: Record<string, string>;
  message: string | null;
  done: boolean;
  email: string;
}
