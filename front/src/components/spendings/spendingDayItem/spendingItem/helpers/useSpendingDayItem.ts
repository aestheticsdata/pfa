import { useState } from "react";
import type { SpendingListItem } from "@components/spendings/types";

const useSpendingDayItem = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [addSpendingEnabled, setAddSpendingEnabled] = useState(true);
  const [spending, setSpending] = useState<SpendingListItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const addSpending = () => {
    setIsModalVisible(true);
    setAddSpendingEnabled(false);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setAddSpendingEnabled(true);
    setSpending(null);
    setIsEditing(false);
  };

  const toggleAddSpending = () => {
    setAddSpendingEnabled(!addSpendingEnabled);
  };

  const editSpending = (spending: SpendingListItem) => {
    setIsEditing(true);
    setIsModalVisible(true);
    setAddSpendingEnabled(false);
    setSpending(spending);
  };

  return {
    isModalVisible,
    addSpendingEnabled,
    spending,
    isEditing,
    addSpending,
    closeModal,
    toggleAddSpending,
    editSpending,
  }
}

export default useSpendingDayItem;
