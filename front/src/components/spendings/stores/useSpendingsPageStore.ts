import { SpendingsPageStoreContext } from "@components/spendings/stores/spendingsPageContext";
import { useContext } from "react";
import { useStore } from "zustand";

import type { SpendingsPageState } from "@components/spendings/interfaces/spendingsPageStoreTypes";

const useSpendingsPageStore = <T>(selector: (state: SpendingsPageState) => T): T => {
  const store = useContext(SpendingsPageStoreContext);
  if (!store) {
    throw new Error("useSpendingsPageStore must be used inside SpendingsPageStoreProvider");
  }
  return useStore(store, selector);
};

export default useSpendingsPageStore;
