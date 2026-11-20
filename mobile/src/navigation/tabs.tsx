import { navigationText } from "@text/fr/navigation";
import { layout } from "@theme/tokens";
import { ChartColumn, House, List, Star } from "lucide-react-native";

import type { TabItem } from "@ui/interfaces/uiTypes";

/** Route names of the four tabs, as their folders under `app/(tabs)/` are named. */
export const TAB_ROUTE = {
  home: "home",
  spendings: "spendings",
  exceptionals: "exceptionals",
  stats: "stats",
} as const;

const icon = (Glyph: typeof House) => (color: string) => (
  <Glyph
    size={layout.icon.lg}
    strokeWidth={layout.iconStroke}
    color={color}
  />
);

export const TABS: readonly TabItem[] = [
  { name: TAB_ROUTE.home, label: navigationText.tabs.home, icon: icon(House) },
  { name: TAB_ROUTE.spendings, label: navigationText.tabs.spendings, icon: icon(List) },
  { name: TAB_ROUTE.exceptionals, label: navigationText.tabs.exceptionals, icon: icon(Star) },
  { name: TAB_ROUTE.stats, label: navigationText.tabs.stats, icon: icon(ChartColumn) },
];
