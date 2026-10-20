import type { Dictionary } from "@text/interfaces/textTypes";

/** Key into navBar.links — resolved to the active-locale label via useTranslations("navBar"). */
export type NavLabelKey = keyof Dictionary["navBar"]["links"];
