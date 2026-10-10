import { botsHref } from "@components/panel/bots/botsQuery";
import { BOTS_PAGE_SIZE } from "@contracts/panel";
import { cx } from "@lib/classNames/cx";
import { BOTS_TEXT } from "@text/bots";
import Link from "next/link";

import type { PagerProps } from "@components/panel/bots/interfaces/botsTypes";

const PAGE_LINK =
  "inline-flex h-10 items-center rounded-ctl border border-line px-3 text-body text-muted no-underline hover:text-text tablet:h-7 tablet:px-2.5 tablet:text-xs";

/** `1–20 of 124 · ← Prev · 1/7 · Next →`; 20 rows a page. */
const Pager = ({ app, data, filters }: PagerProps) => {
  const from = data.total ? data.page * BOTS_PAGE_SIZE + 1 : 0;
  const to = Math.min(data.total, (data.page + 1) * BOTS_PAGE_SIZE);
  const link = (page: number, label: string, enabled: boolean) =>
    enabled ? (
      <Link
        href={botsHref(app, { ...filters, page })}
        scroll={false}
        className={PAGE_LINK}
      >
        {label}
      </Link>
    ) : (
      <span className={cx(PAGE_LINK, "opacity-40")}>{label}</span>
    );
  return (
    <div className="flex items-center gap-2.5 border-t border-line-soft px-3.5 py-2 font-mono text-xs text-dim">
      <span>{data.total ? BOTS_TEXT.range(from, to, data.total) : "0"}</span>
      <span className="flex-1" />
      {link(data.page - 1, BOTS_TEXT.prev, data.page > 0)}
      <span>
        {data.page + 1}/{data.pages}
      </span>
      {link(data.page + 1, BOTS_TEXT.next, data.page < data.pages - 1)}
    </div>
  );
};

export default Pager;
