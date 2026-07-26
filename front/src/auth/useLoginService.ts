"use client";

import useRequestHelper from "@helpers/useRequestHelper";
import { AuthResponseSchema } from "@src/schemas/auth";

import type { AuthResponse } from "@auth/interfaces/authTypes";

const useLoginService = () => {
  const { request } = useRequestHelper();

  // Rejects on failure (e.g. 401) so the caller can surface an inline error;
  // no toast here — login errors are shown inline in the form.
  const loginService = async (email: string, password: string): Promise<AuthResponse> => {
    const result = await request("/users", {
      method: "POST",
      data: {
        email,
        password,
      },
    });
    return AuthResponseSchema.parse(result.data);
  };

  return {
    loginService,
  };
};

export default useLoginService;
