/** Error codes the API puts in `errorCode` (Nest 12 machine-readable errors). No imports: see `interfaces/`. */
export const AUTH_ERROR = {
  invalidCredentials: "AUTH_INVALID_CREDENTIALS",
  rateLimited: "AUTH_RATE_LIMITED",
  sessionRequired: "AUTH_SESSION_REQUIRED",
  sealed: "AUTH_ALREADY_SET_UP",
  recoveryFailed: "AUTH_RECOVERY_FAILED",
  csrf: "AUTH_CSRF",
} as const;
