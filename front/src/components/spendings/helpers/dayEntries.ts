import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { DAY_ENTRY_KIND } from "@components/spendings/config/constants";

import type { DayEntry, GroupDayEntry, PillStop } from "@components/spendings/interfaces/spendingGroupTypes";
import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

const toSingleEntry = (spending: SpendingItem): DayEntry => ({
  kind: DAY_ENTRY_KIND.spending,
  ID: spending.ID,
  label: spending.label,
  category: spending.category,
  amount: Number(spending.amount),
  date: spending.date,
  invoicefile: spending.invoicefile,
  spending,
  spendingIDs: [spending.ID],
});

/**
 * Folds a day's spendings into day-card rows (PFA-189): the lines of a group
 * become one entry, placed where its first line was; plain spendings stay as
 * they are. Lines keep their order inside the group.
 */
export const buildDayEntries = (spendings: SpendingItem[]): DayEntry[] => {
  const entries: DayEntry[] = [];
  const groups = new Map<string, GroupDayEntry>();

  for (const spending of spendings) {
    if (!spending.groupID) {
      entries.push(toSingleEntry(spending));
      continue;
    }
    const group = groups.get(spending.groupID);
    if (group) {
      group.lines.push(spending);
      group.spendingIDs.push(spending.ID);
      group.amount += Number(spending.amount);
      group.invoicefile ??= spending.invoicefile;
      continue;
    }
    const entry: GroupDayEntry = {
      kind: DAY_ENTRY_KIND.group,
      ID: spending.groupID,
      label: spending.groupLabel ?? spending.label,
      category: spending.category,
      amount: Number(spending.amount),
      date: spending.date,
      invoicefile: spending.invoicefile,
      lines: [spending],
      spendingIDs: [spending.ID],
    };
    groups.set(spending.groupID, entry);
    entries.push(entry);
  }

  return entries;
};

/**
 * Entries sharing each receipt file (PFA-189): a shared receipt is several
 * entries pointing at the same file, a group counting once.
 */
export const groupEntriesByReceipt = (entries: DayEntry[]): Map<string, DayEntry[]> => {
  const byFile = new Map<string, DayEntry[]>();
  for (const entry of entries) {
    if (!entry.invoicefile) continue;
    byFile.set(entry.invoicefile, [...(byFile.get(entry.invoicefile) ?? []), entry]);
  }
  return byFile;
};

/** The colour stops of a group's stacked pill: each line's share of the total. */
export const stackedPillGradient = (colors: PillStop[]): string => {
  const total = colors.reduce((sum, c) => sum + c.amount, 0) || 1;
  let acc = 0;
  const stops = colors.map(({ color, amount }) => {
    const start = (acc / total) * 100;
    acc += amount;
    return `${color} ${start.toFixed(1)}% ${((acc / total) * 100).toFixed(1)}%`;
  });
  return `linear-gradient(180deg, ${stops.join(", ")})`;
};

/** The colour of a row's pill: its category, or a group's stacked categories. */
export const entryPill = (entry: DayEntry) =>
  entry.kind === DAY_ENTRY_KIND.group
    ? stackedPillGradient(
        entry.lines.map((l) => ({ color: l.categoryColor || CATEGORY_FALLBACK, amount: Number(l.amount) })),
      )
    : entry.spending.categoryColor || CATEGORY_FALLBACK;

const LABEL_SEPARATOR = /\s+[—–-]\s+/;

/**
 * Splits "Store — groceries" into its head and rest; a label without a
 * separator has no head. Seeds the "Group N spendings" modal.
 */
export const splitSpendingLabel = (label: string): { head: string | null; rest: string } => {
  const parts = label.split(LABEL_SEPARATOR);
  return parts.length > 1 ? { head: parts[0], rest: parts.slice(1).join(" — ") } : { head: null, rest: label };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Pre-fill of the "Group N spendings" modal: the common head of the labels
 * when they all share one ("Store — x", "Store — y" → "Store"), else the first
 * head or label; each line's detail is what follows the head, capitalized.
 * A selected group brings its own lines and details.
 */
export const suggestMerge = (entries: DayEntry[]) => {
  const heads = entries.map((e) => (e.kind === DAY_ENTRY_KIND.group ? e.label : splitSpendingLabel(e.label).head));
  const known = heads.filter((h): h is string => !!h);
  const allSame = known.length > 0 && known.every((h) => h.toLowerCase() === known[0].toLowerCase());
  const label = allSame ? known[0] : (known[0] ?? entries[0]?.label ?? "");

  const lines = entries.flatMap((entry) =>
    entry.kind === DAY_ENTRY_KIND.group
      ? entry.lines.map((line) => ({ spending: line, detail: line.detail ?? "" }))
      : [{ spending: entry.spending, detail: capitalize(splitSpendingLabel(entry.label).rest) }],
  );

  return { label, lines };
};
