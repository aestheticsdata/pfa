"use client";

import { isMacPlatform } from "@lib/keyboard";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Whether the viewer is on a Mac, for showing ⌘ or Ctrl. The server cannot
 * know, so it renders the Mac variant and the client corrects it right after
 * hydration — without a mismatch error.
 */
export const useIsMac = () => useSyncExternalStore(subscribe, isMacPlatform, () => true);
