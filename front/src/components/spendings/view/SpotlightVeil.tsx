"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { useDismissOnInteraction } from "@components/shared/hooks/useDismissOnInteraction";
import { useTrackedRect } from "@components/shared/hooks/useTrackedRect";
import { useState } from "react";
import { createPortal } from "react-dom";

import type { RefObject } from "react";

// Breathing room between the row and the ring, so the ring never sits on the
// category bar, the label or the amount. Wider across than down: rows sit flush
// against each other vertically, the card's padding leaves room on the sides.
const PADDING_X = 12;
const PADDING_Y = 4;

interface SpotlightVeilProps {
  target: RefObject<HTMLElement | null>;
}

/**
 * Darkens the page around the spending picked from search (PFA-188), tracking
 * its row while the page and the day card scroll it into place. Portalled to
 * the body so no transformed or clipping ancestor can trap the fixed box. Runs
 * its course on its own, or steps aside on the first interaction; either way
 * the end of its animation consumes the spotlight request.
 */
const SpotlightVeil = ({ target }: SpotlightVeilProps) => {
  const rect = useTrackedRect(target);
  const setSpotlightSpendingId = useDatePickerWrapperStore((state) => state.setSpotlightSpendingId);
  const [dismissed, setDismissed] = useState(false);
  useDismissOnInteraction(() => setDismissed(true));

  if (!rect) return null;

  return createPortal(
    <div
      aria-hidden
      className="pfa-spotlight-veil"
      data-dismissed={dismissed}
      style={{
        top: rect.top - PADDING_Y,
        left: rect.left - PADDING_X,
        width: rect.width + PADDING_X * 2,
        height: rect.height + PADDING_Y * 2,
      }}
      // The flash on ::after bubbles its own animationend here; only the veil's
      // own end consumes the request.
      onAnimationEnd={(event) => {
        if (!event.pseudoElement) setSpotlightSpendingId(null);
      }}
    />,
    document.body,
  );
};

export default SpotlightVeil;
