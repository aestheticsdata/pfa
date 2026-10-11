import useReceiptLineDrafts from "@components/spendings/receiptLines/hooks/useReceiptLineDrafts";
import ReceiptLineRow from "@components/spendings/receiptLines/ReceiptLineRow";
import ReceiptLinesSummary from "@components/spendings/receiptLines/ReceiptLinesSummary";
import { lineAmount, sumLines } from "@components/spendings/receiptLines/receiptLineDrafts";
import StorePicker from "@components/spendings/receiptLines/StorePicker";
import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";
import { Plus } from "lucide-react";
import { useState } from "react";

import type { SavedReceipt } from "@src/schemas/receiptLines";

interface ReceiptLinesEditorProps {
  initial: SavedReceipt;
  spendingAmount: number;
  receiptTotal?: number | null;
  isSaving: boolean;
  onSave: (receipt: SavedReceipt) => void;
  onCancel: () => void;
}

/** The store and lines to check and correct before they are saved (PFA-214, PFA-218). */
const ReceiptLinesEditor = ({
  initial,
  spendingAmount,
  receiptTotal,
  isSaving,
  onSave,
  onCancel,
}: ReceiptLinesEditorProps) => {
  const texts = useTranslations("spendings");
  const t = texts.receiptLines;
  const { drafts, invalidKeys, update, add, remove, validate } = useReceiptLineDrafts(initial.lines);
  const [store, setStore] = useState(initial.store);
  const sum = sumLines(drafts.map((d) => lineAmount(d) ?? 0));

  const save = () => {
    const lines = validate();
    if (lines) onSave({ lines, store });
  };

  return (
    <div className="flex flex-col gap-3">
      <StorePicker
        value={store}
        onChange={setStore}
      />

      <div className="flex flex-col gap-2">
        {drafts.map((draft) => (
          <ReceiptLineRow
            key={draft.key}
            draft={draft}
            isInvalid={invalidKeys.includes(draft.key)}
            onChange={update}
            onRemove={remove}
          />
        ))}
      </div>

      <button
        type="button"
        data-testid="receipt-line-add"
        onClick={add}
        className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-md px-2 py-1 text-sm font-medium text-elec transition-colors hover:bg-elec/10"
      >
        <Plus className="size-4" />
        {t.addLine}
      </button>

      <ReceiptLinesSummary
        sum={sum}
        spendingAmount={spendingAmount}
        receiptTotal={receiptTotal}
      />

      {invalidKeys.length > 0 && <p className="text-sm text-neg">{t.invalidLines}</p>}

      <div className="flex gap-2.5">
        <Button
          type="button"
          variant="muted"
          size="lg"
          onClick={onCancel}
          className="flex-1 text-base"
        >
          {texts.actions.cancel}
        </Button>
        <Button
          type="button"
          data-testid="receipt-lines-save"
          variant="primary"
          size="lg"
          disabled={isSaving}
          onClick={save}
          className="flex-1 text-base"
        >
          {t.accept}
        </Button>
      </div>
    </div>
  );
};

export default ReceiptLinesEditor;
