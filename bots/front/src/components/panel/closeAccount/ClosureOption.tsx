import { cx } from "@lib/classNames/cx";

import type { ClosureOptionProps } from "@components/panel/closeAccount/interfaces/closeTypes";

/** One of the two outcomes, as a bordered radio row (red when chosen). */
const ClosureOption = ({ checked, onSelect, title, description, testId }: ClosureOptionProps) => (
  <label
    data-testid={testId}
    className={cx(
      "mb-2 flex min-h-11 cursor-pointer items-start gap-2.5 rounded-ctl border px-3 py-2.5 text-body tablet:min-h-0",
      checked ? "border-bad bg-badbg" : "border-line",
    )}
  >
    <input
      type="radio"
      name="closure"
      checked={checked}
      onChange={onSelect}
      className="mt-0.75 accent-(--bad)"
    />
    <span>
      {title}
      <span className="block text-xs text-dim">{description}</span>
    </span>
  </label>
);

export default ClosureOption;
