"use client";

import { useToastStore } from "@components/panel/shared/toastStore";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { ActionResult } from "@lib/api/interfaces/apiTypes";

/**
 * Runs a panel change (a server action), then toasts the outcome and re-reads the page — the
 * runner's new state shows at once instead of on the next 2-second tick.
 */
export default function useApply(): {
  pending: boolean;
  apply: (change: () => Promise<ActionResult>, success: string) => void;
} {
  const router = useRouter();
  const show = useToastStore((state) => state.show);
  const [pending, start] = useTransition();
  const apply = (change: () => Promise<ActionResult>, success: string) =>
    start(async () => {
      const result = await change();
      show(result.ok ? success : (result.message ?? success));
      router.refresh();
    });
  return { pending, apply };
}
