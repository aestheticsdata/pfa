"use client";

import useApply from "@components/hooks/useApply";
import { stateTone } from "@components/panel/bots/botState";
import Card from "@components/ui/Card";
import CardHeader from "@components/ui/CardHeader";
import Dot from "@components/ui/Dot";
import Switch from "@components/ui/Switch";
import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { BOT_VIEW_STATE } from "@contracts/panel";
import { setBots } from "@lib/panel/panelActions";
import { botPath } from "@lib/panel/routes";
import { BOTS_TEXT } from "@text/bots";
import { OVERVIEW_TEXT } from "@text/overview";
import Link from "next/link";

import type { DailyBotsCardProps } from "@components/panel/overview/interfaces/overviewTypes";

/** The four permanent bots: state, current action, pace, own switch. A row opens the drawer. */
const DailyBotsCard = ({ app, bots }: DailyBotsCardProps) => {
  const { pending, apply } = useApply();
  const text = OVERVIEW_TEXT.daily;
  return (
    <Card testId="daily-card">
      <CardHeader
        title={text.title}
        sub={text.sub}
      />
      <div className="flex flex-col pt-1.5 pb-2">
        {bots.length === 0 && <p className="m-0 px-3.5 py-5.5 text-center text-body text-dim">{text.none}</p>}
        {bots.map((bot) => {
          const live = bot.state === BOT_VIEW_STATE.running || bot.state === BOT_VIEW_STATE.degraded;
          return (
            <Link
              key={bot.id}
              href={botPath(app, bot.id)}
              scroll={false}
              className="grid min-h-13 grid-cols-(--grid-daily-row) items-center gap-3 px-3.5 py-1.75 text-text no-underline hover:bg-hover tablet:min-h-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-mono font-medium">
                  <Dot tone={stateTone(bot.state)} />
                  {bot.id}
                  {bot.incident && <Tag tone={TONE.bad}>{BOTS_TEXT.incident}</Tag>}
                </div>
                <div className="truncate font-mono text-xs text-dim">
                  {live && bot.currentAction
                    ? bot.currentAction
                    : BOTS_TEXT.states[bot.state as keyof typeof BOTS_TEXT.states]?.toLowerCase()}
                </div>
              </div>
              <span className="text-right font-mono text-note text-muted">
                {live ? BOTS_TEXT.perMin(bot.actionsPerMin.toFixed(1)) : "—"}
              </span>
              <Switch
                small
                on={bot.enabled && bot.state !== BOT_VIEW_STATE.blocked}
                disabled={bot.state === BOT_VIEW_STATE.blocked || pending}
                label={BOTS_TEXT.toggle(bot.id)}
                onToggle={() =>
                  apply(
                    () => setBots({ app, ids: [bot.id], enabled: !bot.enabled }),
                    (bot.enabled ? BOTS_TEXT.turnedOff : BOTS_TEXT.turnedOn)(1),
                  )
                }
              />
            </Link>
          );
        })}
      </div>
    </Card>
  );
};

export default DailyBotsCard;
