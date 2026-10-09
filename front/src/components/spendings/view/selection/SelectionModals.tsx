"use client";

import { BATCH_MODAL } from "@components/spendings/config/constants";
import useSpendingsPageStore from "@components/spendings/stores/useSpendingsPageStore";
import MergeGroupModal from "@components/spendings/view/selection/MergeGroupModal";
import ShareReceiptModal from "@components/spendings/view/selection/ShareReceiptModal";
import useExitSelectionOnEscape from "@components/spendings/view/selection/useExitSelectionOnEscape";
import useSelectedEntries from "@components/spendings/view/selection/useSelectedEntries";

/**
 * Page-level side of the multi-selection (PFA-189, PFA-197): Escape leaves it
 * on every card, and the batch dialog a card's selection bar opens lives here,
 * once, so it survives the selection it ends.
 */
const SelectionModals = () => {
  const modal = useSpendingsPageStore((s) => s.batchModal);
  const openBatchModal = useSpendingsPageStore((s) => s.openBatchModal);
  const exitSelection = useSpendingsPageStore((s) => s.exitSelection);
  const flashEntry = useSpendingsPageStore((s) => s.flashEntry);
  const selection = useSelectedEntries();
  useExitSelectionOnEscape();

  const close = () => openBatchModal(null);
  const done = (groupID?: string) => {
    exitSelection();
    if (groupID) flashEntry(groupID);
  };

  if (modal === BATCH_MODAL.merge) {
    return (
      <MergeGroupModal
        selection={selection}
        onClose={close}
        onGrouped={done}
      />
    );
  }
  if (modal === BATCH_MODAL.share) {
    return (
      <ShareReceiptModal
        selection={selection}
        onClose={close}
        onShared={() => done()}
      />
    );
  }
  return null;
};

export default SelectionModals;
