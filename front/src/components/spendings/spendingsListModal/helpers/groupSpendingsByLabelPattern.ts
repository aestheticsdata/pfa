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

/** Below this many named groups the widget says nothing useful and stays hidden. */
export const MIN_NAMED_PATTERN_GROUPS = 2;

/** Shorter words are noise ("le", "un") and never become keys. */
const MIN_TOKEN_LENGTH = 3;

/** A token has to appear in at least two spendings to be worth a group. */
const MIN_DOC_FREQUENCY = 2;

/** Below this length a one-edit distance is not a typo, it is a different word. */
const MIN_FUZZY_LENGTH = 5;

const DIACRITICS = /\p{Diacritic}/gu;
/** Quantities ("x2", "2 x") — dropped before punctuation, which would eat their digits. */
const QUANTITIES = /\b(?:\d+\s*x|x\s*\d+)\b/gu;
/** Punctuation and symbols become word breaks; letters AND digits survive. */
const NON_WORD = /[^\p{L}\p{N}\s]/gu;
/** A word that is nothing but digits is an amount or a count, not a name. */
const PURE_NUMBER = /^\p{N}+$/u;
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
 *
 * Only standalone numbers are dropped ("12,50", the "3" of a count): a digit
 * inside a word stays, because an alphanumeric word is usually a name — a
 * merchant like "z30" must keep its own pattern instead of collapsing to a
 * one-letter non-token that can only fall into "Other" (PFA-170).
 */
const splitWords = (label: string, stripDiacritics: boolean): string[] => {
  const lowered = label.toLowerCase();
  const base = stripDiacritics ? lowered.normalize("NFD").replace(DIACRITICS, "") : lowered.normalize("NFC");
  return base
    .replace(QUANTITIES, " ")
    .replace(NON_WORD, " ")
    .split(SPACES)
    .filter((word) => word.length > 0 && !PURE_NUMBER.test(word));
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

/**
 * Comparators sum integer cents, not floats: float addition is not associative,
 * so two mathematically equal totals can come out a last-bit apart depending on
 * the order the spendings arrived in — flipping a tie before the alphabetical
 * fallback ever runs. Cent sums are exact, so ties stay ties. `sumAmount` keeps
 * feeding the displayed totals.
 */
const cents = (amount: number): number => Math.round(amount * 100);

const sumCents = (entries: Entry[]): number => entries.reduce((acc, entry) => acc + cents(entry.amount), 0);

const buildEntries = (items: SpendingItem[], excluded: ReadonlySet<string>): Entry[] =>
  items.map((item, index) => {
    const tokens = splitWords(item.label, true);
    return {
      index,
      ID: item.ID,
      amount: Number(item.amount) || 0,
      tokens: [
        ...new Set(
          tokens.filter((word) => word.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(word) && !excluded.has(word)),
        ),
      ],
    };
  });

/**
 * How often each spelling of a token was written, so a group can be named after
 * the form the user actually types ("Vélo", not the stripped "velo").
 */
const buildSurfaceCounts = (items: SpendingItem[], excluded: ReadonlySet<string>): Map<string, Map<string, number>> => {
  const counts = new Map<string, Map<string, number>>();

  for (const item of items) {
    const tokens = splitWords(item.label, true);
    const surfaces = splitWords(item.label, false);
    const aligned = surfaces.length === tokens.length;

    tokens.forEach((token, i) => {
      if (token.length < MIN_TOKEN_LENGTH || STOP_WORDS.has(token) || excluded.has(token)) return;
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

/**
 * Clusters, keyed by the token each spending was filed under, spelling variants
 * already merged, and no cluster ever left holding a single spending.
 */
const clusterByKeyToken = (entries: Entry[]): Map<string, Entry[]> => {
  const docFrequency = new Map<string, number>();
  const amountByToken = new Map<string, number>();

  for (const entry of entries) {
    for (const token of entry.tokens) {
      docFrequency.set(token, (docFrequency.get(token) ?? 0) + 1);
      amountByToken.set(token, (amountByToken.get(token) ?? 0) + cents(entry.amount));
    }
  }

  // Most shared first: a spending joins the biggest pattern its label takes
  // part in — "casque velo" belongs with the eight velo spendings, not in a
  // two-spending "casque" bucket. Rarest-first was tried (PFA-168) and
  // scattered a real month into micro-groups that all folded into "Other"
  // (PFA-170). Ties go to the heaviest token, then alphabetical, so the
  // outcome never depends on the order the spendings arrived in.
  const compareTokens = (a: string, b: string): number =>
    (docFrequency.get(b) ?? 0) - (docFrequency.get(a) ?? 0) ||
    (amountByToken.get(b) ?? 0) - (amountByToken.get(a) ?? 0) ||
    a.localeCompare(b, "fr");

  const assign = (dead: Set<string>): Map<string, Entry[]> => {
    const clusters = new Map<string, Entry[]>();
    for (const entry of entries) {
      const candidates = entry.tokens.filter(
        (token) => (docFrequency.get(token) ?? 0) >= MIN_DOC_FREQUENCY && !dead.has(token),
      );
      if (candidates.length === 0) continue;
      const key = candidates.sort(compareTokens)[0];
      const cluster = clusters.get(key);
      if (cluster) cluster.push(entry);
      else clusters.set(key, [entry]);
    }
    return clusters;
  };

  // A key left holding one spending is starved: usually a generic word that
  // pulled a label away from its real pattern and then lost every other member
  // to bigger groups. Retire the most-shared (then heaviest) starved key and
  // re-deal, so its spending falls back to its next candidate — one key per
  // round, because retiring one often revives another. The dead set only
  // grows, so the loop terminates.
  const dead = new Set<string>();
  let clusters = assign(dead);
  mergeCloseClusters(clusters);
  for (;;) {
    const starved = [...clusters.entries()].filter(([, cluster]) => cluster.length < 2).map(([key]) => key);
    if (starved.length === 0) return clusters;
    const victim = starved.sort(
      (a, b) =>
        (docFrequency.get(b) ?? 0) - (docFrequency.get(a) ?? 0) ||
        (amountByToken.get(b) ?? 0) - (amountByToken.get(a) ?? 0) ||
        a.localeCompare(b, "fr"),
    )[0];
    dead.add(victim);
    clusters = assign(dead);
    mergeCloseClusters(clusters);
  }
};

/** Heaviest cluster first — the order merging walks, so the winner is the biggest amount. */
const compareClusters = (a: [string, Entry[]], b: [string, Entry[]]): number =>
  sumCents(b[1]) - sumCents(a[1]) || b[1].length - a[1].length || a[0].localeCompare(b[0], "fr");

const findMergePair = (clusters: Map<string, Entry[]>): [string, string] | null => {
  const keys = [...clusters.entries()].sort(compareClusters).map(([key]) => key);

  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      if (areCloseKeys(keys[i], keys[j])) return [keys[i], keys[j]];
    }
  }

  return null;
};

/**
 * A prefix pair is one stem written two ways ("velo" / "velos"): the stem keeps
 * the key whatever the amounts weigh — it names the pattern better than any
 * longer variant (PFA-170). A fuzzy pair has no stem, so the heavier key wins
 * (`first` comes earlier in the amount ordering findMergePair walks).
 */
const mergeWinner = (first: string, second: string): string => {
  const shorter = first.length <= second.length ? first : second;
  const longer = first.length <= second.length ? second : first;
  return longer.startsWith(shorter) ? shorter : first;
};

/** Folds spelling variants into one another until nothing moves any more. */
const mergeCloseClusters = (clusters: Map<string, Entry[]>): void => {
  let pair = findMergePair(clusters);
  while (pair) {
    const [first, second] = pair;
    const winner = mergeWinner(first, second);
    const loser = winner === first ? second : first;
    clusters.set(winner, [...(clusters.get(winner) ?? []), ...(clusters.get(loser) ?? [])]);
    clusters.delete(loser);
    pair = findMergePair(clusters);
  }
};

/**
 * Buckets `items` by label pattern, biggest first, with the leftovers gathered
 * in a single trailing "Other" group (`isOther`, no name — the UI supplies its
 * copy). Every named group holds at least two spendings. Percentages are shares
 * of the total of `items`, so they always add up to 100. The full ranking is
 * what the widget renders — no folding (PFA-171): "Other" means unclassifiable,
 * not rank six and beyond.
 *
 * `categoryName` is the category the modal shows: labels are often suffixed
 * with it, which makes it the most shared word of the whole set — and a group
 * named after the category, inside that category, says nothing (PFA-171). Its
 * words are excluded from the token space; exact words only, deliberately not
 * the fuzzy closeness of the key merge — a "Bio" category must not swallow a
 * "biocoop" token by prefix.
 */
export const groupSpendingsByLabelPattern = (
  items: SpendingItem[],
  categoryName?: string | null,
): LabelPatternGroup[] => {
  if (items.length === 0) return [];

  const excluded: ReadonlySet<string> = new Set(splitWords(categoryName ?? "", true));
  const entries = buildEntries(items, excluded);
  const clusters = clusterByKeyToken(entries);

  const grouped = new Set([...clusters.values()].flat().map((entry) => entry.index));

  // Leftovers get one more chance before "Other": an entry carrying a written
  // variant of a surviving key (prefix or one edit, the same guards as the key
  // merge) joins that group — biggest group first, so the pick is
  // deterministic. Catches the lone "velos revision" when a velo group exists
  // but "velos" itself was never frequent enough to be a candidate (PFA-170).
  const keysByWeight = [...clusters.entries()].sort(compareClusters).map(([key]) => key);
  for (const entry of entries) {
    if (grouped.has(entry.index)) continue;
    const rescued = keysByWeight.find((key) => entry.tokens.some((token) => areCloseKeys(token, key)));
    if (rescued) {
      clusters.get(rescued)?.push(entry);
      grouped.add(entry.index);
    }
  }

  const others = entries.filter((entry) => !grouped.has(entry.index));

  const displayedTotal = sumAmount(entries);
  const share = (total: number): number => (displayedTotal > 0 ? (total / displayedTotal) * 100 : 0);
  const idsOf = (cluster: Entry[]): string[] => [...cluster].sort((a, b) => a.index - b.index).map((e) => e.ID);

  const surfaceCounts = buildSurfaceCounts(items, excluded);
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
