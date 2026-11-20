import { signInErrorMessage } from "@auth/signInError";
import { ApiError } from "@pfa/shared/api/apiError";
import { authText } from "@text/fr/auth";

describe("signInErrorMessage", () => {
  it.each([
    [new ApiError({ status: 401, data: "" }), authText.signIn.wrongCredentials],
    [new ApiError({ status: 429, data: "" }), authText.signIn.tooManyAttempts],
    [new TypeError("Network request failed"), authText.signIn.unreachable],
    [new ApiError({ status: 500, data: "" }), authText.signIn.unexpected],
    [new Error("?"), authText.signIn.unexpected],
  ])("%s → its message", (error, message) => {
    expect(signInErrorMessage(error)).toBe(message);
  });
});
