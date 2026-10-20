import { COMPARE_ANIM_MS } from "@components/statistics/dayOfWeek/constants";
import { useEffect, useState } from "react";

/**
 * Compare bars grow from 0 on show; on hide they only fade — the width is held
 * through the fade, then reset to 0 off-screen, so hiding never shrinks the bar
 * and the next show grows again.
 */
const useCompareBarsCollapsed = (showCompare: boolean) => {
  const [barsCollapsed, setBarsCollapsed] = useState(true);
  useEffect(() => {
    if (showCompare) {
      setBarsCollapsed(false);
      return;
    }
    const timer = setTimeout(() => setBarsCollapsed(true), COMPARE_ANIM_MS);
    return () => clearTimeout(timer);
  }, [showCompare]);
  return barsCollapsed;
};

export default useCompareBarsCollapsed;
