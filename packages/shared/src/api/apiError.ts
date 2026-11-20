import type { ApiResponse } from "#api/interfaces/httpTypes";

/**
 * A non-2xx answer (PFA-243). `response` keeps the `{ status, data }` shape the web's callers
 * read a status or a server message from.
 */
export class ApiError extends Error {
  readonly response: ApiResponse;

  constructor(response: ApiResponse) {
    super(`Request failed with status code ${response.status}`);
    this.name = "ApiError";
    this.response = response;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** True for a request that never got an answer: offline, DNS, refused connection. */
export const isNetworkError = (error: unknown) => error instanceof TypeError;
