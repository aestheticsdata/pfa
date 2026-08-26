"use client";

interface AnimatedScrollOptions {
  /** Headroom left above the element — the sticky toolbars live up there. */
  offset?: number;
  duration?: number;
}

/**
 * Scrolls the window until `element` sits `offset` px below the viewport top, on a
 * requestAnimationFrame ease-out. Returns a canceller (nothing to cancel when the
 * element is already in place).
 *
 * Not `scrollIntoView({ behavior: "smooth" })`: browsers turn that one into an
 * instant jump whenever the OS asks for reduced motion, and this scroll *is* the
 * feedback that something appeared further down the page — skipped, it reads as
 * "my click did nothing". Aborts the moment the user takes the wheel back, so it
 * never fights them for the scrollbar.
 */
export const animatedScrollIntoView = (
  element: HTMLElement,
  { offset = 0, duration = 520 }: AnimatedScrollOptions = {},
): (() => void) | undefined => {
  const start = window.scrollY;
  const distance = element.getBoundingClientRect().top - offset;
  if (Math.abs(distance) < 2) return undefined;

  let frame = 0;
  const detach = () => {
    window.removeEventListener("wheel", abort);
    window.removeEventListener("touchstart", abort);
  };
  function abort() {
    cancelAnimationFrame(frame);
    detach();
  }

  const step = (ts: number, startTs = ts) => {
    const p = Math.min(1, (ts - startTs) / duration);
    window.scrollTo(0, start + distance * (1 - (1 - p) ** 3));
    if (p < 1) frame = requestAnimationFrame((next) => step(next, startTs));
    else detach();
  };

  window.addEventListener("wheel", abort, { passive: true });
  window.addEventListener("touchstart", abort, { passive: true });
  frame = requestAnimationFrame((ts) => step(ts));

  return abort;
};
