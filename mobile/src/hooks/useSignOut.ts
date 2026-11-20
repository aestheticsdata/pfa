import { useAuth } from "@auth/authStore";
import { api } from "@lib/api";
import { revokeToken } from "@pfa/shared/api/fetchers/users";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Revokes the token server-side when the network allows, then forgets it on the device and drops
 * every cached figure. Signing out offline still signs out: the token then simply expires.
 */
export const useSignOut = () => {
  const queryClient = useQueryClient();
  const signOut = useAuth((state) => state.signOut);

  return async () => {
    await revokeToken(api).catch(() => undefined);
    queryClient.clear();
    await signOut();
  };
};
