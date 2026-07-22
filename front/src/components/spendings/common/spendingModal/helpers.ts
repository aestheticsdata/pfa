import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";

import type { Dictionary } from "@text/index";

export const FALLBACK_COLOR = CATEGORY_FALLBACK;

/** Units are locale-dependent ("o/Ko/Mo" in FR, "B/KB/MB" in EN), so the caller
 *  supplies them from the active dictionary along with the number locale. */
export const humanSize = (
  bytes: number,
  units: Dictionary["spendings"]["modal"]["fileSize"],
  locale: string,
) => {
  if (bytes < 1024) return `${bytes} ${units.bytes}`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1024)} ${units.kilobytes}`;
  const megabytes = (bytes / 1_048_576).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${megabytes} ${units.megabytes}`;
};

export const getRandomHexColor = () => {
  const r = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
};
