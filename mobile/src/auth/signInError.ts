import { isApiError, isNetworkError } from "@pfa/shared/api/apiError";
import { authText } from "@text/fr/auth";

const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;

/** What the sign-in screen says when the API refuses or cannot be reached. */
export const signInErrorMessage = (error: unknown) => {
  if (isNetworkError(error)) return authText.signIn.unreachable;
  if (isApiError(error)) {
    if (error.response.status === HTTP_UNAUTHORIZED) return authText.signIn.wrongCredentials;
    if (error.response.status === HTTP_TOO_MANY_REQUESTS) return authText.signIn.tooManyAttempts;
  }
  return authText.signIn.unexpected;
};
