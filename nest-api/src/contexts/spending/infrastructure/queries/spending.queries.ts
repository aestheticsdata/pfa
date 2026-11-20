import type {
  SpendingListItem,
  SpendingSearchPage,
} from "@contexts/spending/infrastructure/queries/interfaces/spendingItemTypes";
import {
  escapeLikeQuery,
  MIN_SEARCH_LENGTH,
  spendingSearchTextWhere,
} from "@contexts/spending/infrastructure/queries/search-where";
import { SPENDING_ROW_SELECT, toSpendingItem } from "@contexts/spending/infrastructure/queries/spending-row";
import type { SpendingLabelSuggestion } from "@contexts/spending/interface/dto/spending-label-suggestion.interface";
import type { SpendingsSearchQueryDto } from "@contexts/spending/interface/dto/spendings-search-query.dto";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

// Whole-history search (COS-114) streams results a page at a time. The minimum
// query length and the text-match clause live in search-where.helper.ts, shared
// with the statistics search timeline (COS-160).
const SEARCH_PAGE_SIZE = 50;

// Label autocomplete (COS-23): the modal shows a small chip row under the field,
// so only the top few labels are returned. Matches the maquette's three chips.
const LABEL_SUGGESTIONS_LIMIT = 3;

/**
 * The read side of the Spending context (PFA-273): lists, search, years, label suggestions. Reads
 * go straight to the rows, shaped for the screen — no aggregate is built to be serialised.
 */
@Injectable()
export class SpendingQueries {
  constructor(private readonly prisma: PrismaService) {}

  async getSpendings(from: string, to: string, userID: string): Promise<SpendingListItem[]> {
    const results = await this.prisma.spendings.findMany({
      where: {
        userID,
        date: { gte: new Date(from), lte: new Date(to) },
      },
      orderBy: { date: "asc" },
      select: { ...SPENDING_ROW_SELECT, group: { select: { label: true } } },
    });

    return results.map((row) => ({
      ...toSpendingItem(row, userID),
      // The front folds rows sharing a groupID into one collapsible row (PFA-189).
      groupLabel: row.group?.label ?? null,
    }));
  }

  // Whole-history text search over the user's spendings (COS-114). Matches the
  // label OR the (accessible) category name, newest first, capped. Returns the
  // capped page plus the unbounded total so the UI can say "N résultats". The
  // category is flattened to name/color exactly like getSpendings, and a category
  // owned by another user is nulled out defensively.
  async searchSpendings(
    userID: string,
    { q: query, cursor, year }: SpendingsSearchQueryDto,
  ): Promise<SpendingSearchPage> {
    const q = query.trim();
    const hasText = q.length >= MIN_SEARCH_LENGTH;
    const yearNum = year ? Number(year) : Number.NaN;
    const hasYear = Number.isInteger(yearNum);

    // Need at least a usable term OR a year filter, else there is nothing to search.
    if (!hasText && !hasYear) {
      return { items: [], nextCursor: null, total: 0 };
    }

    const where = {
      userID,
      ...(hasText ? spendingSearchTextWhere(escapeLikeQuery(q)) : {}),
      // Year filter: half-open [year-01-01, next-year-01-01) covers the whole year
      // regardless of any time component on the date column.
      ...(hasYear
        ? {
            date: {
              gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
              lt: new Date(`${yearNum + 1}-01-01T00:00:00.000Z`),
            },
          }
        : {}),
    };

    // Keyset (cursor) pagination: a common term (e.g. a category name) can match
    // thousands of rows, so results stream a page at a time as the user scrolls,
    // rather than capping (which would hide older months) or shipping everything.
    // Ordered newest-first with the unique ID as tiebreaker so the cursor is
    // stable. We over-fetch one row to know whether a further page exists without
    // a spurious empty request at exact page-size multiples. `total` is counted
    // once, on the first page only (COS-114).
    const rows = await this.prisma.spendings.findMany({
      where,
      orderBy: [{ date: "desc" }, { ID: "desc" }],
      select: SPENDING_ROW_SELECT,
      take: SEARCH_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { ID: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > SEARCH_PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, SEARCH_PAGE_SIZE) : rows;

    const items = pageRows.map((row) => toSpendingItem(row, userID));

    const nextCursor = hasMore ? items[items.length - 1].ID : null;
    const total = cursor ? undefined : await this.prisma.spendings.count({ where });

    return { items, nextCursor, total };
  }

  // Years the user has spendings in, newest first — powers the search modal's
  // year filter (COS-114). Derived from the min/max spending date, so a
  // continuously-used account yields a contiguous range.
  async getSpendingYears(userID: string): Promise<number[]> {
    const range = await this.prisma.spendings.aggregate({
      where: { userID },
      _min: { date: true },
      _max: { date: true },
    });

    const min = range._min.date;
    const max = range._max.date;
    if (!min || !max) {
      return [];
    }

    const years: number[] = [];
    for (let y = max.getUTCFullYear(); y >= min.getUTCFullYear(); y--) {
      years.push(y);
    }
    return years;
  }

  // Label autocomplete for the spending modal (COS-23). Returns the user's own
  // past spending labels ranked by how often they've used each, filtered by the
  // typed prefix, each carrying its most-used category so selecting one can
  // pre-fill the category. An empty query returns the most frequent labels (shown
  // when the field is empty), and a prefix matching nothing falls back to that
  // same global ranking: the modal's chip row must never go empty, since an
  // appearing/disappearing row resizes the dialog mid-typing (COS-159). The label
  // equal to the current input is kept for the same reason — clicking it still
  // pre-fills the category. Category resolution honors the owned-or-global rule
  // used across the app; a label only ever used uncategorized yields a null
  // category.
  async getLabelSuggestions(query: string, userID: string): Promise<SpendingLabelSuggestion[]> {
    const q = query.trim();
    // Escape LIKE metacharacters so a literal % or _ in the prefix matches
    // literally instead of acting as a wildcard (same guard as searchSpendings).
    const escaped = escapeLikeQuery(q);

    const groupLabels = (prefix?: string) =>
      this.prisma.spendings.groupBy({
        by: ["label", "categoryID"],
        where: { userID, ...(prefix ? { label: { startsWith: prefix } } : {}) },
        _count: true,
      });

    const matched = await groupLabels(q ? escaped : undefined);
    const grouped = q && matched.length === 0 ? await groupLabels() : matched;

    // Fold the (label, category) groups into one bucket per label: total uses,
    // plus — among the categorized uses only — the tally per category.
    const buckets = new Map<string, { total: number; byCategory: Map<string, number> }>();
    for (const group of grouped) {
      const bucket = buckets.get(group.label) ?? { total: 0, byCategory: new Map<string, number>() };
      bucket.total += group._count;
      if (group.categoryID) {
        bucket.byCategory.set(group.categoryID, (bucket.byCategory.get(group.categoryID) ?? 0) + group._count);
      }
      buckets.set(group.label, bucket);
    }

    // Rank by total use (then alphabetically) and keep the top few — the modal
    // shows a small chip row.
    const ranked = [...buckets.entries()]
      .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
      .slice(0, LABEL_SUGGESTIONS_LIMIT);

    // Dominant category id per surviving label (most-used; null if only ever
    // uncategorized).
    const dominantCategoryId = (byCategory: Map<string, number>): string | null => {
      let winnerId: string | null = null;
      let winnerCount = 0;
      for (const [categoryID, count] of byCategory) {
        if (count > winnerCount) {
          winnerCount = count;
          winnerId = categoryID;
        }
      }
      return winnerId;
    };

    const labelToCategoryId = new Map(ranked.map(([label, bucket]) => [label, dominantCategoryId(bucket.byCategory)]));

    // Resolve those ids to names in one query, honoring the owned-or-global rule.
    const ids = [...new Set([...labelToCategoryId.values()].filter((id): id is string => id !== null))];
    const categories =
      ids.length > 0
        ? await this.prisma.categories.findMany({
            where: { ID: { in: ids }, OR: [{ userID }, { userID: null }] },
            select: { ID: true, name: true },
          })
        : [];
    const nameById = new Map(categories.map((c) => [c.ID, c.name]));

    return ranked.map(([label]) => {
      const categoryID = labelToCategoryId.get(label);
      return { label, category: categoryID ? (nameById.get(categoryID) ?? null) : null };
    });
  }
}
