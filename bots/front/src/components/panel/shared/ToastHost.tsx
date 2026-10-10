"use client";

import { useToastStore } from "@components/panel/shared/toastStore";
import { cx } from "@lib/classNames/cx";

/** The panel's toast: dark pill at the bottom centre, above the mobile bulk bar when it is up. */
const ToastHost = () => {
  const message = useToastStore((state) => state.message);
  const raised = useToastStore((state) => state.raised);
  if (!message) return null;
  return (
    <div
      role="status"
      data-testid="toast"
      className={cx(
        "fixed left-1/2 z-20 w-max max-w-toast-max -translate-x-1/2 rounded-lg bg-text px-3.5 py-2.5 text-center text-body font-medium text-bg",
        raised ? "bottom-toast-raised" : "bottom-toast-bottom tablet:bottom-5",
      )}
    >
      {message}
    </div>
  );
};

export default ToastHost;
