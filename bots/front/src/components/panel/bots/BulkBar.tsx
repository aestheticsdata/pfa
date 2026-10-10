"use client";

import useApply from "@components/hooks/useApply";
import { useSelectionStore } from "@components/panel/bots/selectionStore";
import { useToastStore } from "@components/panel/shared/toastStore";
import Button from "@components/ui/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { setBots } from "@lib/panel/panelActions";
import { BOTS_TEXT } from "@text/bots";
import { useEffect } from "react";

import type { BulkBarProps } from "@components/panel/bots/interfaces/botsTypes";

/**
 * "N selected · Turn on · Turn off · Clear selection". In the card from 700px; on a phone it is
 * fixed to the bottom of the screen (above the home indicator) and the toast moves above it.
 */
const BulkBar = ({ app }: BulkBarProps) => {
  const selected = useSelectionStore((state) => state.selected);
  const clear = useSelectionStore((state) => state.clear);
  const setRaised = useToastStore((state) => state.setRaised);
  const { pending, apply } = useApply();
  const count = selected.length;
  useEffect(() => {
    setRaised(count > 0);
    return () => setRaised(false);
  }, [count, setRaised]);
  if (count === 0) return null;

  const turn = (enabled: boolean) =>
    apply(() => setBots({ app, ids: selected, enabled }), (enabled ? BOTS_TEXT.turnedOn : BOTS_TEXT.turnedOff)(count));

  return (
    <>
      {/* Room for the fixed bar at the bottom of the page on a phone (handoff `.has-bulk`). */}
      <div className="h-37.5 tablet:hidden" />
      <div
        data-testid="bulk-bar"
        className="fixed inset-x-0 bottom-0 z-6 grid grid-cols-2 gap-2 border-t border-ok-d bg-bulk px-gut pt-2.5 pb-bulk shadow-bulk tablet:static tablet:flex tablet:flex-wrap tablet:items-center tablet:gap-2.5 tablet:border-b tablet:border-line-soft tablet:bg-okbg tablet:px-3.5 tablet:py-2 tablet:shadow-none"
      >
        <b className="self-center font-mono text-body">{BOTS_TEXT.selected(count)}</b>
        <Button
          size={BUTTON_SIZE.sm}
          disabled={pending}
          onClick={() => turn(true)}
          className="row-start-2 justify-center"
        >
          {BOTS_TEXT.turnOn}
        </Button>
        <Button
          size={BUTTON_SIZE.sm}
          disabled={pending}
          onClick={() => turn(false)}
          className="row-start-2 justify-center"
        >
          {BOTS_TEXT.turnOff}
        </Button>
        <span className="hidden flex-1 tablet:block" />
        <Button
          variant={BUTTON_VARIANT.ghost}
          size={BUTTON_SIZE.sm}
          onClick={clear}
          className="col-start-2 row-start-1 justify-self-end"
        >
          {BOTS_TEXT.clear}
        </Button>
      </div>
    </>
  );
};

export default BulkBar;
