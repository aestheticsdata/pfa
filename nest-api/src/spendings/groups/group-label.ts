/** Separator between a group's name and a line's detail in the stored label. */
export const GROUP_LABEL_SEPARATOR = " — ";

/**
 * The `label` stored on a group line (PFA-189): "<group> — <detail>", or the
 * group name alone when the line has no detail. Search, stats and label
 * suggestions read this column, so a line stays findable by its store name.
 */
export function composeGroupLineLabel(groupLabel: string, detail?: string | null): string {
  const name = groupLabel.trim();
  const rest = detail?.trim();
  return rest ? `${name}${GROUP_LABEL_SEPARATOR}${rest}` : name;
}

/** Same-day check on `@db.Date` values (they come back as UTC midnights). */
export function isSameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}
