import { cn } from "@lib/utils";

/**
 * pfa brand wordmark — "PFA" set in Keania One (rounded techno display face).
 *
 * The face is loaded once via next/font in the root layout (exposed as the
 * `--font-keania` variable / the `font-wordmark` utility); the rest of the app
 * stays on Geist. Kept beside Logo so the two brand marks live — and are reused
 * — together.
 *
 * Colour: the primary-button (« Nouvelle dépense ») gradient, built from the
 * same design tokens (`--accent-strong` → `--chart-2` → `--chart-3`) so the CTA
 * and the wordmark share one accent. For a plain variant, pass
 * `className="text-ink"` (or drop the gradient classes below).
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-wordmark text-2xl leading-none",
        "bg-[linear-gradient(100deg,var(--accent-strong)_0%,var(--chart-2)_55%,var(--chart-3)_100%)] bg-clip-text [-webkit-background-clip:text] text-transparent",
        className,
      )}
    >
      PFA
    </span>
  );
}
