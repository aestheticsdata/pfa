import { emptyDraft, toLinePayloads } from "@components/spendings/common/spendingModal/group/groupLineDrafts";
import { useState } from "react";

import type { GroupLineDraft } from "@components/spendings/interfaces/spendingGroupTypes";

/**
 * Lines of the group editor (PFA-189): add / edit / remove, and the lines whose
 * amount failed validation — flagged until the user touches the amount again.
 */
const useGroupLines = (initial: () => GroupLineDraft[]) => {
  const [drafts, setDrafts] = useState<GroupLineDraft[]>(initial);
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);

  const updateLine = (key: string, patch: Partial<GroupLineDraft>) => {
    setDrafts((current) => current.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    if ("amount" in patch) {
      setInvalidKeys((keys) => keys.filter((k) => k !== key));
    }
  };

  const addLine = () => setDrafts((current) => [...current, emptyDraft()]);

  const removeLine = (key: string) =>
    setDrafts((current) => (current.length > 1 ? current.filter((d) => d.key !== key) : current));

  /** The request lines, or null after flagging the invalid ones. */
  const validate = () => {
    const { lines, invalidKeys: invalid } = toLinePayloads(drafts);
    setInvalidKeys(invalid);
    return invalid.length > 0 ? null : lines;
  };

  const replaceLines = (next: GroupLineDraft[]) => {
    setDrafts(next);
    setInvalidKeys([]);
  };

  return { drafts, invalidKeys, updateLine, addLine, removeLine, replaceLines, validate };
};

export default useGroupLines;
