import useReceiptShares from "@components/spendings/services/useReceiptShares";
import useSpendingsPageStore from "@components/spendings/stores/useSpendingsPageStore";
import { useEffect } from "react";

import type { DayEntry } from "@components/spendings/interfaces/spendingGroupTypes";

const FLASH_MS = 1500;

/**
 * Page-level state of one day-card row (PFA-189): selection mode and tick, the
 * shared-receipt count and cross-card hover highlight, and the post-grouping
 * flash. Shared by the plain and the group rows.
 */
const useEntryRowState = (entry: DayEntry, dayIso: string) => {
  const isSelecting = useSpendingsPageStore((s) => s.selectingDays.includes(dayIso));
  const isSelected = useSpendingsPageStore((s) => Boolean(s.selected[entry.ID]));
  const toggleEntry = useSpendingsPageStore((s) => s.toggleEntry);
  const hoveredReceipt = useSpendingsPageStore((s) => s.hoveredReceipt);
  const setHoveredReceipt = useSpendingsPageStore((s) => s.setHoveredReceipt);
  const isFlashing = useSpendingsPageStore((s) => s.flashEntryID === entry.ID);
  const flashEntry = useSpendingsPageStore((s) => s.flashEntry);
  const sharesOf = useReceiptShares();

  const sharers = sharesOf(entry.invoicefile);
  const shareCount = sharers.length > 1 ? sharers.length : 0;
  const isReceiptHighlighted = shareCount > 0 && hoveredReceipt === entry.invoicefile;

  useEffect(() => {
    if (!isFlashing) return;
    const timer = setTimeout(() => flashEntry(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [isFlashing, flashEntry]);

  return {
    isSelecting,
    isSelected,
    toggle: () => toggleEntry(entry.ID, dayIso),
    shareCount,
    isReceiptHighlighted,
    isFlashing,
    onPointerEnter: () => setHoveredReceipt(shareCount > 0 ? entry.invoicefile : null),
    onPointerLeave: () => setHoveredReceipt(null),
  };
};

export default useEntryRowState;
