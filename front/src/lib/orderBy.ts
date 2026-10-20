import type { SortDir, SortKey } from "@lib/interfaces/orderByTypes";

export const SORT_DIR = { asc: "asc", desc: "desc" } as const;

/**
 * A stable multi-key sort returning a new array (PFA-236, replaces lodash's `orderBy`): items are
 * compared on `keys[0]`, ties broken by `keys[1]`… each in the direction at the same index
 * (ascending when missing). Values compare with `<` / `>`, as lodash did — plain code-unit order for
 * strings, so callers normalize case themselves.
 */
export const orderBy = <T>(items: readonly T[], keys: SortKey<T>[], dirs: SortDir[]) =>
  items.toSorted((a, b) => {
    for (const [i, key] of keys.entries()) {
      const left = key(a);
      const right = key(b);
      if (left === right) continue;
      const order = left < right ? -1 : 1;
      return dirs[i] === SORT_DIR.desc ? -order : order;
    }
    return 0;
  });
