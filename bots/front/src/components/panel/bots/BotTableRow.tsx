"use client";

import useNow from "@components/hooks/useNow";
import BotSwitch from "@components/panel/bots/BotSwitch";
import { isLive } from "@components/panel/bots/botState";
import { errorClass } from "@components/panel/bots/errorTone";
import KindTag from "@components/panel/bots/KindTag";
import Sparkline from "@components/panel/bots/Sparkline";
import StatusLabel from "@components/panel/bots/StatusLabel";
import { useSelectionStore } from "@components/panel/bots/selectionStore";
import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { cx } from "@lib/classNames/cx";
import { ago, count } from "@lib/format/format";
import { botPath } from "@lib/panel/routes";
import { BOTS_TEXT } from "@text/bots";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { BotRowProps } from "@components/panel/bots/interfaces/botsTypes";

const CELL = "border-b border-line-soft px-2.5 py-1.5 align-middle first:pl-3.5 last:pr-3.5";

/** One row of the Bots table (≥ 700px). Clicking it opens the bot's drawer. */
const BotTableRow = ({ app, bot, focused }: BotRowProps) => {
  const router = useRouter();
  const now = useNow(5000);
  const selected = useSelectionStore((state) => state.selected.includes(bot.id));
  const toggle = useSelectionStore((state) => state.toggle);
  const live = isLive(bot.state);
  return (
    <tr
      onClick={() => router.push(botPath(app, bot.id), { scroll: false })}
      data-testid={`bot-row-${bot.id}`}
      className={cx(
        "cursor-pointer font-mono text-note [&>td]:hover:bg-hover",
        !live && "text-dim",
        selected && "[&>td]:bg-okbg",
        focused && "focus-row",
      )}
    >
      <td className={CELL}>
        <input
          type="checkbox"
          className="size-3.75 cursor-pointer accent-(--ok) align-middle"
          checked={selected}
          onChange={() => toggle(bot.id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={BOTS_TEXT.select(bot.id)}
        />
      </td>
      <td className={CELL}>
        <div className={cx("whitespace-nowrap font-medium", live ? "text-text" : "text-muted")}>
          <Link
            href={botPath(app, bot.id)}
            scroll={false}
            onClick={(event) => event.stopPropagation()}
            className="text-inherit no-underline"
          >
            {bot.id}
          </Link>
          {bot.incident && (
            <Tag
              tone={TONE.bad}
              className="ml-2"
            >
              {BOTS_TEXT.incident}
            </Tag>
          )}
        </div>
        <div className="text-xs text-dim">{bot.email}</div>
      </td>
      <td className={CELL}>
        <KindTag kind={bot.kind} />
      </td>
      <td className={cx(CELL, "font-sans")}>
        <StatusLabel state={bot.state} />
      </td>
      <td className={CELL}>{live && bot.currentAction ? bot.currentAction : "—"}</td>
      <td className={cx(CELL, "hidden desktop:table-cell")}>
        <Sparkline bot={bot} />
      </td>
      <td className={cx(CELL, "text-right")}>{live ? bot.actionsPerMin.toFixed(1) : "—"}</td>
      <td className={cx(CELL, "text-right", errorClass(bot.errorRate))}>
        {bot.total ? `${bot.errorRate.toFixed(1)}%` : "—"}
      </td>
      <td className={cx(CELL, "hidden text-right xl:table-cell")}>{bot.total ? count(bot.total) : "—"}</td>
      <td
        className={cx(CELL, "text-muted")}
        suppressHydrationWarning
      >
        {ago(bot.lastSeenAt, now)}
      </td>
      <td className={cx(CELL, "text-right")}>
        <BotSwitch
          app={app}
          bot={bot}
        />
      </td>
    </tr>
  );
};

export default BotTableRow;
