import { cn } from "@lib/utils";

/**
 * Centered "No… / No data yet" placeholder shown inside a card when a list is
 * empty. Defaults to `py-6`; pass `className="py-10"` for the roomier variant.
 */
function EmptyState({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("py-6 text-center text-xs text-ink-4", className)}
      {...props}
    />
  );
}

export { EmptyState };
