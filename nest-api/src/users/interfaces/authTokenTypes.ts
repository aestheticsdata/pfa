import type { SignInResponse } from "@users/users.service";

/** `POST /users/token` (PFA-286): the user, and the Bearer token the mobile app keeps. */
export interface TokenSignInResponse extends SignInResponse {
  token: string;
  /** Seconds the token stays valid without being used; each use extends it. */
  expiresIn: number;
}
