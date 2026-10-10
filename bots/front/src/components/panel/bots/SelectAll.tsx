"use client";

import { useSelectionStore } from "@components/panel/bots/selectionStore";
import { BOTS_TEXT } from "@text/bots";

import type { SelectAllProps } from "@components/panel/bots/interfaces/botsTypes";

/** Selects every bot matching the filters — across pages, not only the visible 20. */
const SelectAll = ({ ids }: SelectAllProps) => {
  const all = useSelectionStore((state) => ids.length > 0 && ids.every((id) => state.selected.includes(id)));
  const setAll = useSelectionStore((state) => state.setAll);
  return (
    <input
      type="checkbox"
      className="size-3.75 cursor-pointer accent-(--ok) align-middle"
      checked={all}
      onChange={() => setAll(ids, !all)}
      aria-label={BOTS_TEXT.selectAll}
    />
  );
};

export default SelectAll;
