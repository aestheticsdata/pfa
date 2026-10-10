import { cx } from "@lib/classNames/cx";

import type { SwitchProps } from "@components/ui/interfaces/uiTypes";

/**
 * The on/off switch: 38×22 everywhere (`small`), 64×34 in the drawer header. On a phone the small
 * one keeps its size but gets a larger invisible hit area.
 */
const Switch = ({ on, label, onToggle, small = false, disabled = false, testId }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    data-testid={testId}
    onClick={(event) => {
      event.stopPropagation();
      onToggle();
    }}
    className={cx(
      "relative shrink-0 rounded-full border p-0 disabled:cursor-default disabled:opacity-35",
      on ? "border-ok-d bg-okbg2" : "border-line bg-panel2",
      small ? "h-5.5 w-9.5 max-tablet:hit-area" : "h-8.5 w-16",
    )}
  >
    <span
      className={cx(
        "absolute rounded-full transition-[translate,background-color] duration-200",
        on ? "bg-ok" : "bg-dim",
        small ? "top-0.5 left-0.5 size-4" : "top-0.75 left-0.75 size-6.5",
        on && (small ? "translate-x-4" : "translate-x-7.5"),
      )}
    />
  </button>
);

export default Switch;
