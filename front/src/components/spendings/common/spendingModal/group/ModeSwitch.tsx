import { SPENDING_MODAL_MODE } from "@components/spendings/config/constants";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { Layers, RectangleHorizontal } from "lucide-react";

import type { SpendingModalMode } from "@components/spendings/interfaces/spendingGroupTypes";

interface ModeSwitchProps {
  mode: SpendingModalMode;
  onChange: (mode: SpendingModalMode) => void;
}

/** Segmented control on top of the spending modal: one spending, or a group (PFA-189). */
const ModeSwitch = ({ mode, onChange }: ModeSwitchProps) => {
  const { groups: t } = useTranslations("spendings");
  const options = [
    { value: SPENDING_MODAL_MODE.single, label: t.modeSingle, Icon: RectangleHorizontal },
    { value: SPENDING_MODAL_MODE.group, label: t.modeGroup, Icon: Layers },
  ];

  return (
    <fieldset
      aria-label={t.modeAria}
      className="m-0 flex min-w-0 gap-0.75 rounded-md border border-line bg-surface-base p-0.75"
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          data-testid={`spending-mode-${value}`}
          onClick={() => onChange(value)}
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-center gap-1.75 rounded-sm px-2.5 py-2 text-sm font-medium transition-colors",
            mode === value
              ? "bg-surface-hi text-ink shadow-[inset_0_0_0_1px_var(--line)]"
              : "text-ink-3 hover:text-ink-2",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </fieldset>
  );
};

export default ModeSwitch;
