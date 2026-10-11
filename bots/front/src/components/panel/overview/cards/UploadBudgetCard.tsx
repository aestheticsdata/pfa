import Card from "@components/ui/Card";
import CardHeader from "@components/ui/CardHeader";
import Label from "@components/ui/Label";
import { cx } from "@lib/classNames/cx";
import { longSpan, megabytes } from "@lib/format/format";
import { OVERVIEW_TEXT } from "@text/overview";

import type { StatusOnlyProps } from "@components/panel/overview/interfaces/overviewTypes";

const WARN_SHARE = 75;
const BAD_SHARE = 90;
const LOW_REMAINING_MB = 40;
/** Below this, the budget counts as spent (one more receipt wouldn't fit). */
const EMPTY_MB = 0.2;
/** Fixed-width, right-aligned: a number changing length leaves the unit after it in place. */
const MB_SLOT = "inline-block min-w-mb-slot text-right tabular-nums";
const COUNT_SLOT = "inline-block min-w-count-slot text-right tabular-nums";
const PERCENT_SLOT = "inline-block min-w-percent-slot text-right tabular-nums";

/** 400 MB per rolling 365 days across all bots: used, remaining, this week, when it runs out. */
const UploadBudgetCard = ({ status }: StatusOnlyProps) => {
  const budget = status.uploadBudget;
  const text = OVERVIEW_TEXT.budget;
  const share = budget.budgetMB ? (budget.usedMB / budget.budgetMB) * 100 : 0;
  const fill = share > BAD_SHARE ? "bg-bad" : share > WARN_SHARE ? "bg-warn" : "bg-ok";
  const empty = budget.remainingMB <= EMPTY_MB;
  return (
    <Card testId="budget-card">
      <CardHeader
        title={text.title}
        sub={text.sub(status.limits.windowDays)}
      />
      <div className="px-3.5 pt-1 pb-3.5">
        <div className="mt-3 mb-2.5 flex h-3 overflow-hidden rounded-md bg-bg">
          <span
            className={cx("block h-full", fill)}
            style={{ width: `${share}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <Label>{text.used}</Label>
            <div className="mt-0.5 font-mono text-lg font-semibold">
              <span className={MB_SLOT}>{megabytes(budget.usedMB)}</span>
              <small className="text-xs font-medium text-dim">
                {" "}
                MB · <span className={PERCENT_SLOT}>{share.toFixed(0)}</span>%
              </small>
            </div>
          </div>
          <div>
            <Label>{text.remaining}</Label>
            <div
              className={cx(
                "mt-0.5 font-mono text-lg font-semibold",
                budget.remainingMB < LOW_REMAINING_MB && "text-bad",
              )}
            >
              <span className={MB_SLOT}>{megabytes(budget.remainingMB)}</span>
              <small className="text-xs font-medium text-dim"> MB</small>
            </div>
          </div>
          <div>
            <Label>{text.week}</Label>
            <div className="mt-0.5 font-mono text-lg font-semibold">
              <span className={COUNT_SLOT}>{budget.weekUploads}</span>
              <small className="text-xs font-medium text-dim">
                {" "}
                {text.uploads} · <span className={MB_SLOT}>{megabytes(budget.weekMB)}</span> MB
              </small>
            </div>
          </div>
          <div>
            <Label>{text.pace}</Label>
            <div className="mt-0.5 font-mono text-title font-semibold">
              {empty ? text.exhausted : budget.emptyInDays !== null ? text.emptyIn(longSpan(budget.emptyInDays)) : "—"}
            </div>
          </div>
        </div>
        <p className="m-0 mt-3 font-mono text-xs text-dim">{empty ? text.hintEmpty : text.hint}</p>
      </div>
    </Card>
  );
};

export default UploadBudgetCard;
