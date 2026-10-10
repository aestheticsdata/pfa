"use client";

import useApply from "@components/hooks/useApply";
import ActionSwitch from "@components/panel/actions/ActionSwitch";
import ActionTags from "@components/panel/actions/ActionTags";
import { errorClass } from "@components/panel/bots/errorTone";
import Button from "@components/ui/Button";
import Card from "@components/ui/Card";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { cx } from "@lib/classNames/cx";
import { enableAllActions } from "@lib/panel/panelActions";
import { ACTIONS_TEXT } from "@text/metrics";

import type { ActionsCardProps } from "@components/panel/actions/interfaces/actionsTypes";

const HEAD =
  "whitespace-nowrap border-b border-line-soft px-2.5 py-2 text-left text-tiny font-medium uppercase tracking-th text-dim first:pl-3.5 last:pr-3.5";
const CELL = "border-b border-line-soft px-2.5 py-1.5 align-middle first:pl-3.5 last:pr-3.5";

/** The action registry: weight, share of the rate, errors, switch. A table from 700px, rows below. */
const ActionsCard = ({ app, view, running }: ActionsCardProps) => {
  const { pending, apply } = useApply();
  const maxWeight = Math.max(1, ...view.actions.map((action) => action.weight));
  const perMin = (value: number | null, enabled: boolean) => (value !== null && enabled && running ? value : null);
  return (
    <Card
      className="mt-4"
      testId="actions-card"
    >
      <header className="flex flex-wrap items-baseline gap-2.5 px-3.5 pt-3">
        <h2 className="m-0 text-sm font-medium tracking-title">{ACTIONS_TEXT.title}</h2>
        <span className="flex-1" />
        <Button
          variant={BUTTON_VARIANT.ghost}
          size={BUTTON_SIZE.sm}
          disabled={pending}
          onClick={() => apply(() => enableAllActions(app), ACTIONS_TEXT.allOn)}
        >
          {ACTIONS_TEXT.enableAll}
        </Button>
      </header>
      <div className="mt-2.5 hidden overflow-x-auto tablet:block">
        <table className="w-full border-collapse [&_tbody_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              <th className={HEAD}>{ACTIONS_TEXT.columns.action}</th>
              <th className={HEAD}>{ACTIONS_TEXT.columns.weight}</th>
              <th className={cx(HEAD, "text-right")}>{ACTIONS_TEXT.columns.perMin}</th>
              <th className={cx(HEAD, "text-right")}>{ACTIONS_TEXT.columns.errors}</th>
              <th className={HEAD} />
            </tr>
          </thead>
          <tbody>
            {view.actions.map((action) => {
              const rate = perMin(action.perMin, action.enabled);
              return (
                <tr
                  key={action.name}
                  className={cx("text-body", !action.enabled && "text-dim")}
                >
                  <td className={CELL}>
                    <div
                      className={cx("flex items-center gap-2 font-mono font-medium", !action.enabled && "text-muted")}
                    >
                      {action.name}
                      <ActionTags action={action} />
                    </div>
                    <div className="text-xs text-dim">{action.description}</div>
                  </td>
                  <td className={cx(CELL, "whitespace-nowrap font-mono text-note")}>
                    <span className="mr-2 inline-block h-1 w-15 overflow-hidden rounded-xs bg-bg align-middle">
                      <i
                        className="block h-full bg-muted"
                        style={{ width: `${(action.weight / maxWeight) * 100}%` }}
                      />
                    </span>
                    {action.weight}
                  </td>
                  <td className={cx(CELL, "text-right font-mono")}>{rate ?? "—"}</td>
                  <td className={cx(CELL, "text-right font-mono", action.enabled && errorClass(action.errorRate))}>
                    {action.enabled ? `${action.errorRate.toFixed(1)}%` : "—"}
                  </td>
                  <td className={cx(CELL, "text-right")}>
                    <ActionSwitch
                      app={app}
                      action={action}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 tablet:hidden">
        {view.actions.map((action) => {
          const rate = perMin(action.perMin, action.enabled);
          return (
            <div
              key={action.name}
              className="grid grid-cols-(--grid-limit) items-center gap-3 border-t border-line-soft py-2.5 pr-4.5 pl-3.5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cx("truncate font-mono text-body font-medium", !action.enabled && "text-muted")}>
                    {action.name}
                  </span>
                  <ActionTags action={action} />
                </div>
                <div className="mt-px text-xs text-dim">{action.description}</div>
                <div className="mt-0.75 flex items-center gap-1.5 whitespace-nowrap font-mono text-xs text-dim">
                  <span className="mr-1.5 inline-block h-1 w-11 overflow-hidden rounded-xs bg-bg">
                    <i
                      className="block h-full bg-muted"
                      style={{ width: `${(action.weight / maxWeight) * 100}%` }}
                    />
                  </span>
                  {action.weight}
                  <span>· {rate !== null ? ACTIONS_TEXT.perMin(rate) : "—"}</span>
                  <span className={action.enabled ? errorClass(action.errorRate) : undefined}>
                    · {action.enabled ? ACTIONS_TEXT.err(action.errorRate.toFixed(1)) : "—"}
                  </span>
                </div>
              </div>
              <ActionSwitch
                app={app}
                action={action}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ActionsCard;
