"use client";

import { toast } from "sonner";
import useRequestHelper from "@helpers/useRequestHelper";

import type { AuthResponse } from "@auth/types";

const useLoginService = () => {
  const { request } = useRequestHelper();

  const loginService = async (
    email: string,
    password: string,
  ): Promise<AuthResponse | undefined> => {
    try {
      const result = await request("/users", {
        method: "POST",
        data: {
          email,
          password,
        },
      });
      return result.data as AuthResponse;
    } catch (e) {
      toast.error("Échec de connexion", {
        description: String(e),
      });
    }
  };

  return {
    loginService,
  };
};

export default useLoginService;
