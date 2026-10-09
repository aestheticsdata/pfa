"use client";

import { SpendingsPageStoreContext } from "@components/spendings/stores/spendingsPageContext";
import { createSpendingsPageStore } from "@components/spendings/stores/spendingsPageStore";
import { useState } from "react";

import type { ReactNode } from "react";

interface SpendingsPageStoreProviderProps {
  children: ReactNode;
}

const SpendingsPageStoreProvider = ({ children }: SpendingsPageStoreProviderProps) => {
  const [store] = useState(createSpendingsPageStore);
  return <SpendingsPageStoreContext.Provider value={store}>{children}</SpendingsPageStoreContext.Provider>;
};

export default SpendingsPageStoreProvider;
