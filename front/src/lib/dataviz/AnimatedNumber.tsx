"use client";

import useFormat from "@i18n/useFormat";
import useCountUp from "@lib/dataviz/useCountUp";
import { cn } from "@lib/utils";

import type { CSSProperties } from "react";

interface AnimatedNumberProps {
  /** Target value; the number counts up to it from 0 (and re-counts when it changes). */
  value: number;
  /** Fraction digits — 0 for an integer, 2 for cents, etc. */
  decimals?: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Locale for grouping/decimal separators. Defaults to the active app locale. */
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Text colour (any CSS colour / var). */
  color?: string;
  /** Font size — a number (px) or any CSS length. */
  fontSize?: number | string;
  /** Font weight. */
  weight?: number | string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

/**
 * A number that counts up from zero, formatted for a locale. Purely presentational
 * and reusable — colour, font size, decimals, speed, prefix/suffix are all props.
 * Built on the `useCountUp` primitive.
 */
const AnimatedNumber = ({
  value,
  decimals = 0,
  duration = 850,
  locale,
  prefix = "",
  suffix = "",
  color,
  fontSize,
  weight,
  className,
  style,
  ariaLabel,
}: AnimatedNumberProps) => {
  const { numberLocale } = useFormat();
  const activeLocale = locale ?? numberLocale;
  const animated = useCountUp(value, duration);
  const text = animated.toLocaleString(activeLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const finalText = value.toLocaleString(activeLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      role="img"
      className={cn("tabular-nums", className)}
      style={{ color, fontSize, fontWeight: weight, ...style }}
      aria-label={ariaLabel ?? `${prefix}${finalText}${suffix}`}
    >
      {prefix}
      {text}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;
