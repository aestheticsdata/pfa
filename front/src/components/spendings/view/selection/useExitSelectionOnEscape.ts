import useSpendingsPageStore from "@components/spendings/stores/useSpendingsPageStore";
import { useEffect } from "react";

/**
 * Escape leaves the selection on every card (PFA-189) — unless a dialog is
 * open: that Escape belongs to the dialog.
 */
const useExitSelectionOnEscape = () => {
  const isSelecting = useSpendingsPageStore((s) => s.selectingDays.length > 0);
  const exitSelection = useSpendingsPageStore((s) => s.exitSelection);

  useEffect(() => {
    if (!isSelecting) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector('[role="dialog"]')) return;
      exitSelection();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSelecting, exitSelection]);
};

export default useExitSelectionOnEscape;
