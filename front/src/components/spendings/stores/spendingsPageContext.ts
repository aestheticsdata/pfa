import { createContext } from "react";

import type { SpendingsPageStore } from "@components/spendings/interfaces/spendingsPageStoreTypes";

export const SpendingsPageStoreContext = createContext<SpendingsPageStore | null>(null);
