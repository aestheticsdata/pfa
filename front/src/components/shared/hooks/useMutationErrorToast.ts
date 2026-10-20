"use client";

import useTranslations from "@i18n/useTranslations";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * One toast for every failed mutation that has no `onError` of its own (PFA-242). They used to
 * end in a `console.log`, so a failed save looked exactly like a successful one. Mutations with a
 * dedicated message keep their `onError` and are left alone here. Errors stay out of Iknos: the
 * API already logs the failed request.
 */
const useMutationErrorToast = () => {
  const queryClient = useQueryClient();
  const common = useTranslations("common");
  const message = common.mutationFailed;

  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "error") return;
        if (event.mutation.options.onError) return;
        toast.error(message);
      }),
    [queryClient, message],
  );
};

export default useMutationErrorToast;
