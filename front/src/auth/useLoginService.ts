"use client";

import useRequestHelper from "@helpers/useRequestHelper";

import type { AuthResponse } from "@auth/types";

const useLoginService = () => {
  const { request } = useRequestHelper();

  // Rejects on failure (e.g. 401) so the caller can surface an inline error;
  // no toast here — login errors are shown inline in the form.
  const loginService = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    const result = await request("/users", {
      method: "POST",
      data: {
        email,
        password,
      },
    });
    return result.data as AuthResponse;
  };

  return {
    loginService,
  };
};

export default useLoginService;
