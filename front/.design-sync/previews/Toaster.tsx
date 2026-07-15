import { ExportButton, Toaster } from "pfa-next";
import { useEffect, useRef } from "react";

/**
 * Sonner mounts an empty fixed region and renders nothing until something calls
 * `toast()`. `toast` is not part of the DS surface, but ExportButton is — and it
 * is pfa's one real toast caller ("Export à venir"), wired to the same sonner
 * instance as this Toaster. Firing it on mount is therefore the only honest way
 * to show the Toaster doing its job. The effect runs after the Toaster has
 * subscribed, and `duration` is pinned so the toast is still up at capture time.
 */
const useAutoToast = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector("button")?.click();
  }, []);
  return ref;
};

/**
 * `Toaster` reads `useTheme()` and defaults to `"system"` when no ThemeProvider
 * is mounted. The app always resolves dark (`defaultTheme="dark"`,
 * `enableSystem={false}`), but this host has no provider, so sonner would fall
 * back to its LIGHT chrome: a white `--gray1` close button under pfa's
 * dark-theme `--normal-text` ink, i.e. a white X on a white circle. `theme` is
 * sonner's own prop and the component spreads `...props` after it, so pinning
 * it here reproduces the app's real resolved state rather than a fake.
 */
const THEME = "dark" as const;

/** The app configuration: `richColors`, `closeButton`, pinned top-right. */
export const Default = () => {
  const ref = useAutoToast();
  return (
    <div
      ref={ref}
      className="relative min-h-[220px]"
    >
      <ExportButton />
      <Toaster
        richColors
        closeButton
        theme={THEME}
        position="top-right"
        duration={Number.POSITIVE_INFINITY}
      />
    </div>
  );
};

/** The `position` axis — the same toast anchored bottom-center instead. */
export const BottomCenter = () => {
  const ref = useAutoToast();
  return (
    <div
      ref={ref}
      className="relative min-h-[220px]"
    >
      <ExportButton />
      <Toaster
        richColors
        closeButton
        theme={THEME}
        position="bottom-center"
        duration={Number.POSITIVE_INFINITY}
      />
    </div>
  );
};
