import { draftsFromLines, emptyLineDraft, toReceiptLines } from "@components/spendings/receiptLines/receiptLineDrafts";
import { useState } from "react";

import type { ReceiptLineDraft } from "@components/spendings/interfaces/receiptLinesTypes";
import type { ReceiptLine } from "@src/schemas/receiptLines";

/** The editable lines of the receipt-lines modal, seeded once from the proposal or the saved set. */
const useReceiptLineDrafts = (initial: ReceiptLine[]) => {
  const [drafts, setDrafts] = useState<ReceiptLineDraft[]>(() =>
    initial.length > 0 ? draftsFromLines(initial) : [emptyLineDraft()],
  );
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);

  const update = (key: string, patch: Partial<ReceiptLineDraft>) => {
    setDrafts((current) => current.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    setInvalidKeys((keys) => keys.filter((k) => k !== key));
  };

  const add = () => setDrafts((current) => [...current, emptyLineDraft()]);

  const remove = (key: string) => setDrafts((current) => current.filter((d) => d.key !== key));

  /** The lines to save, or null after flagging the ones that cannot be saved. */
  const validate = (): ReceiptLine[] | null => {
    const { lines, invalidKeys: invalid } = toReceiptLines(drafts);
    setInvalidKeys(invalid);
    return invalid.length > 0 ? null : lines;
  };

  return { drafts, invalidKeys, update, add, remove, validate };
};

export default useReceiptLineDrafts;
