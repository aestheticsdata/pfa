import type { LabelPatternGroup } from "@components/spendings/interfaces/labelPatternTypes";
import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

/**
 * Groups the spendings of one category by label pattern (PFA-168).
 *
 * Labels are typed by hand and never normalized, so the same kind of purchase
 * shows up under several spellings ("atelier velo", "velo — reparation",
 * "velo pieces x2"). There is no such grouping anywhere in the data model: this
 * is a purely heuristic, front-side clustering, and it is assumed approximate —
 * five readable buckets beat no view at all. Everything below is deterministic:
 * the same set of spendings always produces the same groups, in the same order.
 */

/** Key of the catch-all bucket. Not a token, so it can never collide with one. */
export const OTHER_GROUP_KEY = "__other__";

/**
 * Key of the collapsed view's catch-all row. A *different* bucket from
 * `OTHER_GROUP_KEY`: it also holds the folded tail, so it must not answer to the
 * same key — a row's key is the identity a click is resolved against, and the
 * two rows do not stand for the same spendings.
 */
export const FOLDED_OTHER_GROUP_KEY = "__folded_other__";

/** Named groups kept before the tail is folded into "Other" (see `foldLabelPatternGroups`). */
export const MAX_LABEL_PATTERN_GROUPS = 5;

/** Below this many named groups the widget says nothing useful and stays hidden. */
export const MIN_NAMED_PATTERN_GROUPS = 2;

/** Shorter words are noise ("le", "un") and never become keys. */
const MIN_TOKEN_LENGTH = 3;

/** A token has to appear in at least two spendings to be worth a group. */
const MIN_DOC_FREQUENCY = 2;

/** Below this length a one-edit distance is not a typo, it is a different word. */
const MIN_FUZZY_LENGTH = 5;

const DIACRITICS = /\p{Diacritic}/gu;
/** Quantities ("x2", "2 x") — dropped before the plain numbers, which would eat their digits. */
const QUANTITIES = /\b(?:\d+\s*x|x\s*\d+)\b/gu;
const NUMBERS = /\d+(?:[.,]\d+)?/gu;
const NON_LETTERS = /[^\p{L}\s]/gu;
const SPACES = /\s+/u;

// French stop words. The ones under three characters are already dropped by
// MIN_TOKEN_LENGTH; they are listed anyway so the set reads as the actual rule.
const STOP_WORDS = new Set([
  "de",
  "du",
  "des",
  "le",
  "la",
  "les",
  "un",
  "une",
  "et",
  "ou",
  "pour",
  "chez",
  "au",
  "aux",
  "en",
  "sur",
  "avec",
  "par",
  "dans",
  "sans",
  "mon",
  "ma",
  "mes",
  "son",
  "sa",
  "ses",
  "ce",
  "cet",
  "cette",
  "que",
  "qui",
  "est",
  "plus",
  "via",
]);

interface Entry {
  index: number;
  ID: string;
  amount: number;
  /** Unique content tokens of the label, diacritic-free. */
  tokens: string[];
}

/**
 * Splits a label into words. With `stripDiacritics` the words are the token
 * space ("vélo" → "velo"); without, they keep their accents and are the display
 * forms. Both passes run the same substitutions, so the two word lists line up
 * index by index — diacritic removal never adds or removes a word.
 */
const splitWords = (label: string, stripDiacritics: boolean): string[] => {
  const lowered = label.toLowerCase();
  const base = stripDiacritics ? lowered.normalize("NFD").replace(DIACRITICS, "") : lowered.normalize("NFC");
  return base.replace(QUANTITIES, " ").replace(NUMBERS, " ").replace(NON_LETTERS, " ").split(SPACES).filter(Boolean);
};

/** Lowercased, accent-free, punctuation- and number-free form of a label. */
export const normalizeLabel = (label: string): string => splitWords(label, true).join(" ");

/** Content words of a label: at least three characters, stop words removed. */
export const tokenizeLabel = (label: string): string[] =>
  splitWords(label, true).filter((word) => word.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(word));

/** Levenshtein distance ≤ 1, short-circuited (the exact distance is never needed). */
const isOneEditApart = (a: string, b: string): boolean => {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (long.length - short.length > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    // Same length → a substitution; different lengths → a deletion in the longer one.
    if (short.length === long.length) i += 1;
    j += 1;
  }
  return true;
};

/** Two keys are the same word written differently: one prefixes the other, or one typo apart. */
const areCloseKeys = (a: string, b: string): boolean => {
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= MIN_TOKEN_LENGTH && longer.startsWith(shorter)) return true;
  return shorter.length >= MIN_FUZZY_LENGTH && isOneEditApart(a, b);
};

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const sumAmount = (entries: Entry[]): number => entries.reduce((acc, entry) => acc + entry.amount, 0);

const buildEntries = (items: SpendingItem[]): Entry[] =>
  items.map((item, index) => {
    const tokens = splitWords(item.label, true);
    return {
      index,
      ID: item.ID,
      amount: Number(item.amount) || 0,
      tokens: [...new Set(tokens.filter((word) => word.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(word)))],
    };
  });

/**
 * How often each spelling of a token was written, so a group can be named after
 * the form the user actually types ("Vélo", not the stripped "velo").
 */
const buildSurfaceCounts = (items: SpendingItem[]): Map<string, Map<string, number>> => {
  const counts = new Map<string, Map<string, number>>();

  for (const item of items) {
    const tokens = splitWords(item.label, true);
    const surfaces = splitWords(item.label, false);
    const aligned = surfaces.length === tokens.length;

    tokens.forEach((token, i) => {
      if (token.length < MIN_TOKEN_LENGTH || STOP_WORDS.has(token)) return;
      const surface = aligned ? (surfaces[i] ?? token) : token;
      const perSurface = counts.get(token) ?? new Map<string, number>();
      perSurface.set(surface, (perSurface.get(surface) ?? 0) + 1);
      counts.set(token, perSurface);
    });
  }

  return counts;
};

const displayName = (key: string, surfaceCounts: Map<string, Map<string, number>>): string => {
  const perSurface = surfaceCounts.get(key);
  if (!perSurface) return capitalize(key);
  const best = [...perSurface.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))[0];
  return capitalize(best[0]);
};

/** Clusters, keyed by the token each spending was filed under. */
const clusterByKeyToken = (entries: Entry[]): Map<string, Entry[]> => {
  const docFrequency = new Map<string, number>();
  const amountByToken = new Map<string, number>();

  for (const entry of entries) {
    for (const token of entry.tokens) {
      docFrequency.set(token, (docFrequency.get(token) ?? 0) + 1);
      amountByToken.set(token, (amountByToken.get(token) ?? 0) + entry.amount);
    }
  }

  // Most discriminant first: the rarest token of the label says the most about
  // it ("velo" over "achat"). Ties go to the heaviest token, then alphabetical,
  // so the outcome never depends on the order the spendings arrived in.
  const compareTokens = (a: string, b: string): number =>
    (docFrequency.get(a) ?? 0) - (docFrequency.get(b) ?? 0) ||
    (amountByToken.get(b) ?? 0) - (amountByToken.get(a) ?? 0) ||
    a.localeCompare(b, "fr");

  const clusters = new Map<string, Entry[]>();

  for (const entry of entries) {
    const candidates = entry.tokens.filter((token) => (docFrequency.get(token) ?? 0) >= MIN_DOC_FREQUENCY);
    if (candidates.length === 0) continue;
    const key = candidates.sort(compareTokens)[0];
    const cluster = clusters.get(key);
    if (cluster) cluster.push(entry);
    else clusters.set(key, [entry]);
  }

  return clusters;
};

/** Heaviest cluster first — the order merging walks, so the winner is the biggest amount. */
const compareClusters = (a: [string, Entry[]], b: [string, Entry[]]): number =>
  sumAmount(b[1]) - sumAmount(a[1]) || b[1].length - a[1].length || a[0].localeCompare(b[0], "fr");

const findMergePair = (clusters: Map<string, Entry[]>): [string, string] | null => {
  const keys = [...clusters.entries()].sort(compareClusters).map(([key]) => key);

  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      if (areCloseKeys(keys[i], keys[j])) return [keys[i], keys[j]];
    }
  }

  return null;
};

/** Folds spelling variants into one another until nothing moves any more. */
const mergeCloseClusters = (clusters: Map<string, Entry[]>): void => {
  let pair = findMergePair(clusters);
  while (pair) {
    const [winner, loser] = pair;
    clusters.set(winner, [...(clusters.get(winner) ?? []), ...(clusters.get(loser) ?? [])]);
    clusters.delete(loser);
    pair = findMergePair(clusters);
  }
};

/**
 * Buckets `items` by label pattern, biggest first, with the leftovers gathered
 * in a single trailing "Other" group (`isOther`, no name — the UI supplies its
 * copy). Every named group holds at least two spendings. Percentages are shares
 * of the total of `items`, so they always add up to 100.
 *
 * The result is the full ranking; `foldLabelPatternGroups` cuts its tail for the
 * collapsed view.
 */
export const groupSpendingsByLabelPattern = (items: SpendingItem[]): LabelPatternGroup[] => {
  if (items.length === 0) return [];

  const entries = buildEntries(items);
  const clusters = clusterByKeyToken(entries);
  mergeCloseClusters(clusters);

  // A candidate token needs two spendings, but each of them may end up filed
  // under a more discriminant token of its own — leaving a lone spending behind,
  // which is not a pattern.
  for (const [key, cluster] of clusters) {
    if (cluster.length < 2) clusters.delete(key);
  }

  const grouped = new Set([...clusters.values()].flat().map((entry) => entry.index));
  const others = entries.filter((entry) => !grouped.has(entry.index));

  const displayedTotal = sumAmount(entries);
  const share = (total: number): number => (displayedTotal > 0 ? (total / displayedTotal) * 100 : 0);
  const idsOf = (cluster: Entry[]): string[] => [...cluster].sort((a, b) => a.index - b.index).map((e) => e.ID);

  const surfaceCounts = buildSurfaceCounts(items);
  const named: LabelPatternGroup[] = [...clusters.entries()].sort(compareClusters).map(([key, cluster]) => {
    const total = sumAmount(cluster);
    return {
      key,
      name: displayName(key, surfaceCounts),
      total,
      count: cluster.length,
      pct: share(total),
      ids: idsOf(cluster),
      isOther: false,
    };
  });

  if (others.length === 0) return named;

  const otherTotal = sumAmount(others);
  return [
    ...named,
    {
      key: OTHER_GROUP_KEY,
      name: "",
      total: otherTotal,
      count: others.length,
      pct: share(otherTotal),
      ids: idsOf(others),
      isOther: true,
    },
  ];
};

/**
 * Keeps the `maxGroups` biggest named groups and folds the long tail into a
 * catch-all row, which always stays last. This is the collapsed view of the
 * widget; "Show all" renders the untouched output of
 * `groupSpendingsByLabelPattern`. Percentages are shares of the same total
 * either way, so they keep adding up to 100 whichever view is on screen.
 *
 * With nothing to fold the input is handed back as it is, so the two views then
 * render the very same rows.
 */
export const foldLabelPatternGroups = (
  groups: LabelPatternGroup[],
  maxGroups: number = MAX_LABEL_PATTERN_GROUPS,
): LabelPatternGroup[] => {
  const named = groups.filter((group) => !group.isOther);
  if (named.length <= maxGroups) return groups;

  const folded = [...named.slice(maxGroups), ...groups.filter((group) => group.isOther)];

  return [
    ...named.slice(0, maxGroups),
    {
      key: FOLDED_OTHER_GROUP_KEY,
      name: "",
      total: folded.reduce((acc, group) => acc + group.total, 0),
      count: folded.reduce((acc, group) => acc + group.count, 0),
      pct: folded.reduce((acc, group) => acc + group.pct, 0),
      ids: folded.flatMap((group) => group.ids),
      isOther: true,
    },
  ];
};
