import type { Page } from "@playwright/test";

export const API = "http://localhost:6100/api";

/**
 * CSRF token bound to the session carried by `page` — the API rejects every
 * mutating call without it. `page.request` reuses the browser session cookie.
 */
export const getCsrfToken = async (page: Page): Promise<string> => {
  const response = await page.request.get(`${API}/users/csrf`);

  if (!response.ok()) {
    throw new Error(`/users/csrf a répondu ${response.status()}`);
  }

  const { csrfToken } = await response.json();

  return csrfToken;
};
