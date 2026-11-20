import { useAuth } from "@auth/authStore";
import { signInErrorMessage } from "@auth/signInError";
import { api } from "@lib/api";
import { signInForToken } from "@pfa/shared/api/fetchers/users";
import { useMutation } from "@tanstack/react-query";

import type { Credentials } from "@pfa/shared/api/fetchers/interfaces/payloadTypes";

/** Email + password → a Bearer token in the Keychain, and the app opens unlocked. */
export const useSignIn = () => {
  const signIn = useAuth((state) => state.signIn);
  const mutation = useMutation({
    mutationFn: (credentials: Credentials) => signInForToken(api, credentials),
    onSuccess: (response) => signIn(response.token),
  });

  return {
    submit: mutation.mutate,
    pending: mutation.isPending,
    error: mutation.error ? signInErrorMessage(mutation.error) : null,
  };
};
