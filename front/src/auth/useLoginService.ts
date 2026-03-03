"use client";

import useRequestHelper from "@helpers/useRequestHelper";
import Swal from "sweetalert2";

import type { AuthResponse } from "@auth/types";

const useLoginService = () => {
  const { request } = useRequestHelper();

  const loginService = async (email: string, password: string): Promise<AuthResponse | undefined> => {
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
      await Swal.fire({
        title: `login error: ${e}`,
        icon: "warning",
        confirmButtonText: "fermer",
      });
    }
  };

  return {
    loginService,
  };
};

export default useLoginService;
