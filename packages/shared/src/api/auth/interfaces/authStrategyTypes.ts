/** What the web hands the cookie strategy: where its CSRF token lives, and what to do when the session ends. */
export interface CookieSessionHooks {
  getCsrfToken: () => string | null;
  setCsrfToken: (token: string) => void;
  onSessionLost: () => void;
}

/** What the mobile app hands the Bearer strategy: its secure-store token, and what to do when it is refused. */
export interface BearerTokenHooks {
  getToken: () => Promise<string | null>;
  onTokenRejected: () => Promise<void>;
}
