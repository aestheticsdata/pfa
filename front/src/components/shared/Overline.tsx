import { cn } from "@lib/utils";

/**
 * The uppercase micro-caption recipe, as a class string — the one place it
 * lives. Use it directly on a semantic element that must not be a `<span>`
 * (e.g. a `<label htmlFor>` form label); otherwise prefer the `<Overline>`
 * component below.
 */
const overlineClass = "text-2xs font-medium uppercase tracking-caps text-ink-4";

/**
 * Uppercase micro-caption used as an eyebrow / label. Pass
 * `className="text-ink-3"` for the brighter tone; `className` is merged last.
 */
function Overline({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(overlineClass, className)}
      {...props}
    />
  );
}

export { Overline, overlineClass };
