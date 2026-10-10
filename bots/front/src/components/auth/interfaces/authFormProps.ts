export interface SignInFormProps {
  /** `Session expired`, or the post-reset notice. */
  notice: string | null;
  /** Where to land after signing in. */
  next: string;
}
