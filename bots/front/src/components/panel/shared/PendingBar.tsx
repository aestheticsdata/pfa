import Button from "@components/ui/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { OVERVIEW_TEXT } from "@text/overview";

import type { PendingBarProps } from "@components/panel/shared/interfaces/sharedTypes";

/** An edit not applied yet: `old → new` with Cancel / Apply. Stacked on a phone. */
const PendingBar = ({ change, onCancel, onApply, busy = false }: PendingBarProps) => (
  <div
    data-testid="pending-bar"
    className="mt-3 flex flex-wrap items-center gap-2.5 rounded-ctl bg-panel2 px-3 py-2.5 text-note tablet:flex-nowrap"
  >
    <span className="basis-full whitespace-pre font-mono tabular tablet:basis-auto">{change}</span>
    <span className="hidden flex-1 tablet:block" />
    <Button
      variant={BUTTON_VARIANT.ghost}
      size={BUTTON_SIZE.sm}
      onClick={onCancel}
      className="flex-1 justify-center tablet:flex-none"
    >
      {OVERVIEW_TEXT.pending.cancel}
    </Button>
    <Button
      variant={BUTTON_VARIANT.primary}
      size={BUTTON_SIZE.sm}
      onClick={onApply}
      disabled={busy}
      data-testid="pending-apply"
      className="flex-1 justify-center tablet:flex-none"
    >
      {OVERVIEW_TEXT.pending.apply}
    </Button>
  </div>
);

export default PendingBar;
