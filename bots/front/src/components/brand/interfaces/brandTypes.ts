import type { AppSummary } from "@contracts/interfaces/panelTypes";

export interface MarkProps {
  /** Side, px: the marks are drawn at a handful of sizes (22, 26, 28, 30, 40). */
  size: number;
}

export interface AppLogoProps extends MarkProps {
  app: Pick<AppSummary, "id" | "name">;
}
