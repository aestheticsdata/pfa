/**
 * PFA mobile design tokens (Claude Design handoff, `mobile/design/`). Units: pt on iOS = dp on
 * Android. Dark = the web's tokens, unchanged; light = derived (same hues, contrast ≥ 4.5:1).
 * No purple anywhere. Every colour, size and radius on screen comes from here.
 */
import { Platform } from "react-native";

import type { ColorScheme } from "@theme/interfaces/themeTypes";
import type { TextStyle, ViewStyle } from "react-native";

export const COLOR_SCHEME = { light: "light", dark: "dark" } as const;

export const palette = {
  light: {
    bg: "#F3F7FA",
    surface: "#FFFFFF",
    surface2: "#EBEEF2",
    surface3: "#E0E4E9",
    sheet: "#FFFFFF",
    line: "#D4D8DD",
    lineSoft: "#E3E7EA",
    ink: "#0B1015",
    ink2: "#3E4348",
    ink3: "#5F6469",
    onInk: "#FFFFFF",
    accent: "#0075AD",
    accentBg: "rgba(0,117,173,0.10)",
    positive: "#257C3A",
    positiveBg: "rgba(37,124,58,0.09)",
    positiveLine: "rgba(37,124,58,0.45)",
    negative: "#C2272D",
    negativeBg: "rgba(194,39,45,0.08)",
    negativeSolid: "#C2272D",
    exceptional: "#006AAA",
    exceptionalBg: "rgba(0,106,170,0.09)",
    warning: "#975800",
    warningBg: "rgba(151,88,0,0.08)",
    segmentOn: "#FFFFFF",
    glass: "rgba(255,255,255,0.86)",
    scrim: "rgba(11,16,21,0.36)",
    onCta: "#0F130F",
    onNegative: "#FFFFFF",
    key: "#E8EBEF",
    bar: "#5FB46E",
  },
  dark: {
    bg: "#000B18",
    surface: "#15171A",
    surface2: "#212428",
    surface3: "#2A2D31",
    sheet: "#15171A",
    line: "#2E3236",
    lineSoft: "#1F2225",
    ink: "#F5F7F9",
    ink2: "#B5B8BA",
    ink3: "#878A8E",
    onInk: "#000B18",
    accent: "#00B4F0",
    accentBg: "rgba(0,180,240,0.14)",
    positive: "#87E496",
    positiveBg: "rgba(135,228,150,0.10)",
    positiveLine: "rgba(135,228,150,0.45)",
    negative: "#FD736D",
    negativeBg: "rgba(253,115,109,0.12)",
    negativeSolid: "#C53637",
    exceptional: "#44A8E7",
    exceptionalBg: "rgba(68,168,231,0.14)",
    warning: "#FAAB3F",
    warningBg: "rgba(250,171,63,0.12)",
    segmentOn: "#2E3237",
    glass: "rgba(21,23,26,0.82)",
    scrim: "rgba(0,0,0,0.60)",
    onCta: "#0F130F",
    onNegative: "#FBEDEC",
    key: "#24272B",
    bar: "#5FB46E",
  },
} as const;

/** Linear gradients: colours, stops, and the CSS angle of the mockups (0° = bottom → top). */
export const gradients = {
  light: {
    cta: { colors: ["#73D885", "#49D9B9", "#3ECCE2"], locations: [0, 0.55, 1], angle: 100 },
    fill: { colors: ["#2F8A45", "#5FC271"], locations: [0, 1], angle: 90 },
    glow: {
      colors: ["rgba(37,124,58,0.28)", "rgba(11,16,21,0.06)", "rgba(0,117,173,0.18)"],
      locations: [0, 0.45, 1],
      angle: 135,
    },
  },
  dark: {
    cta: { colors: ["#87E496", "#52DFBF", "#47D2E8"], locations: [0, 0.55, 1], angle: 100 },
    fill: { colors: ["#45814F", "#87E496"], locations: [0, 1], angle: 90 },
    glow: {
      colors: ["rgba(135,228,150,0.30)", "rgba(255,255,255,0.05)", "rgba(71,210,232,0.16)"],
      locations: [0, 0.45, 1],
      angle: 135,
    },
  },
} as const;

/** Category hues: oklch(0.80 0.09 h) in dark, oklch(0.60 0.12 h) in light. Only as a marker or a dot. */
export const categoryColors = {
  dark: {
    groceries: "#9FCC95",
    restaurants: "#E9B082",
    shopping: "#EBA6C6",
    transport: "#91C3F6",
    coffee: "#DCB87A",
    leisure: "#72D0D0",
    travel: "#C1C37E",
    home: "#72CEDE",
    sport: "#7BD1BA",
    health: "#8ECFA4",
    gifts: "#F2A7A1",
    beauty: "#F0A6B6",
    subscriptions: "#94A3B8",
    bank: "#A3A8B0",
    other: "#94A3B8",
  },
  light: {
    groceries: "#57914A",
    restaurants: "#B36D2A",
    shopping: "#B4608A",
    transport: "#4284C5",
    coffee: "#A57710",
    leisure: "#009696",
    travel: "#85861F",
    home: "#0092A8",
    sport: "#00977C",
    health: "#389560",
    gifts: "#BD615B",
    beauty: "#BA5F76",
    subscriptions: "#64748B",
    bank: "#6B7280",
    other: "#64748B",
  },
} as const;

export const fonts = {
  sans: { regular: "Geist-Regular", medium: "Geist-Medium", semibold: "Geist-SemiBold", bold: "Geist-Bold" },
  mono: { regular: "GeistMono-Regular", medium: "GeistMono-Medium", semibold: "GeistMono-SemiBold" },
} as const;

/** Geist Mono is tabular already; the feature is forced anyway so a fallback font stays aligned. */
const tabular: TextStyle = { fontVariant: ["tabular-nums"] };

export const type = {
  largeTitle: { fontFamily: fonts.sans.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.64 },
  title: { fontFamily: fonts.sans.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.56 },
  title2: { fontFamily: fonts.sans.semibold, fontSize: 20, lineHeight: 26 },
  headline: { fontFamily: fonts.sans.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.sans.regular, fontSize: 16, lineHeight: 22 },
  callout: { fontFamily: fonts.sans.regular, fontSize: 15, lineHeight: 20 },
  subhead: { fontFamily: fonts.sans.medium, fontSize: 14, lineHeight: 19 },
  footnote: { fontFamily: fonts.sans.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.sans.medium, fontSize: 12, lineHeight: 16 },
  tabLabel: { fontFamily: fonts.sans.medium, fontSize: Platform.select({ ios: 10, default: 12 }), lineHeight: 14 },
  overline: {
    fontFamily: fonts.sans.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.88,
    textTransform: "uppercase",
  },
  amountXL: { fontFamily: fonts.mono.medium, fontSize: 44, lineHeight: 48, letterSpacing: -1.32, ...tabular },
  amountL: { fontFamily: fonts.mono.medium, fontSize: 28, lineHeight: 32, letterSpacing: -0.56, ...tabular },
  amountM: { fontFamily: fonts.mono.medium, fontSize: 22, lineHeight: 26, ...tabular },
  amount: { fontFamily: fonts.mono.medium, fontSize: 16, lineHeight: 20, ...tabular },
  amountS: { fontFamily: fonts.mono.regular, fontSize: 13, lineHeight: 16, ...tabular },
} satisfies Record<string, TextStyle>;

/** Ceiling on Dynamic Type / Android font scale. */
export const maxFontScale = { text: 1.6, amount: 1.4 } as const;

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;

export const layout = {
  screenMargin: 16,
  cardPadding: 16,
  cardGap: 12,
  minTouch: Platform.select({ ios: 44, default: 48 }),
  rowHeight: 52,
  rowHeightTwoLines: 58,
  buttonHeight: 54,
  buttonHeightSecondary: 48,
  iconButton: 44,
  chipHeight: 36,
  segmentedHeight: 38,
  fieldHeight: 48,
  fab: 62,
  fabExtendedHeight: 56,
  tabBarHeight: 62,
  navBarHeight: 80,
  navIndicator: { width: 64, height: 32 },
  sheetGrabber: { width: 36, height: 5 },
  categoryMarker: { width: 4, height: 30 },
  categoryDot: 8,
  categoryTile: 28,
  meterHeight: 8,
  chartHeight: 140,
  todayMarker: { width: 2, height: 18 },
  hairline: 1,
  focusRing: 1.5,
  /** Stroke icons only (lucide), at 1.75 — never filled. */
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
  iconStroke: 1.75,
} as const;

export const radius = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
  card: Platform.select({ ios: 20, default: 16 }),
} as const;

const shadowColor = "#0B0F14";

export const elevation = {
  /** Light only: in dark, cards have no shadow and rely on their glow border. */
  card: (scheme: ColorScheme): ViewStyle =>
    scheme === COLOR_SCHEME.light
      ? (Platform.select<ViewStyle>({
          ios: { shadowColor, shadowOpacity: 0.05, shadowRadius: 9, shadowOffset: { width: 0, height: 6 } },
          default: { elevation: 1 },
        }) ?? {})
      : {},
  floating:
    Platform.select<ViewStyle>({
      ios: { shadowColor, shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
      default: { elevation: 6 },
    }) ?? {},
} as const;

export const motion = {
  sheetSpring: { damping: 28, stiffness: 300, mass: 1 },
  durationFast: 150,
  durationBase: 240,
  durationChart: 700,
} as const;

/** Opacity of a pressed control. */
export const pressedOpacity = 0.72;

export const makeTheme = (scheme: ColorScheme) => ({
  scheme,
  colors: palette[scheme],
  categoryColors: categoryColors[scheme],
  gradients: gradients[scheme],
  type,
  space,
  layout,
  radius,
  elevation,
  motion,
});
