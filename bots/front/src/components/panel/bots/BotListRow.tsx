"use client";

import BotSwitch from "@components/panel/bots/BotSwitch";
import { isLive } from "@components/panel/bots/botState";
import { errorClass } from "@components/panel/bots/errorTone";
import KindTag from "@components/panel/bots/KindTag";
import StatusLabel from "@components/panel/bots/StatusLabel";
import { useSelectionStore } from "@components/panel/bots/selectionStore";
import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { cx } from "@lib/classNames/cx";
import { botPath } from "@lib/panel/routes";
import { BOTS_TEXT } from "@text/bots";
import { useRouter } from "next/navigation";

import type { BotRowProps } from "@components/panel/bots/interfaces/botsTypes";

/** A bot on a phone: checkbox (40px target), name + tags + status, action · pace · errors, switch. */
const BotListRow = ({ app, bot, focused }: BotRowProps) => {
  const router = useRouter();
  const selected = useSelectionStore((state) => state.selected.includes(bot.id));
  const toggle = useSelectionStore((state) => state.toggle);
  const live = isLive(bot.state);
  return (
    // biome-ignore lint/a11y/useSemanticElements: a row holding a checkbox and a switch can't be a <button>
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(botPath(app, bot.id), { scroll: false })}
      onKeyDown={(event) => event.key === "Enter" && router.push(botPath(app, bot.id), { scroll: false })}
      className={cx(
        "grid min-h-15.5 cursor-pointer grid-cols-(--grid-bot-row) items-center gap-x-2 gap-y-1 border-t border-line-soft py-2 pr-3.5 pl-1.25 active:bg-hover",
        selected && "bg-okbg",
        focused && "focus-bar",
      )}
    >
      <label
        className="grid size-10 cursor-pointer place-items-center"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <input
          type="checkbox"
          className="size-3.75 cursor-pointer accent-(--ok)"
          checked={selected}
          onChange={() => toggle(bot.id)}
          aria-label={BOTS_TEXT.select(bot.id)}
        />
      </label>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cx("truncate font-mono text-body font-medium", !live && "text-muted")}>{bot.id}</span>
          <KindTag kind={bot.kind} />
          {bot.incident && <Tag tone={TONE.bad}>{BOTS_TEXT.incident}</Tag>}
          <span className="text-note">
            <StatusLabel state={bot.state} />
          </span>
        </div>
        <div className="mt-0.75 flex min-w-0 items-center gap-1.5 whitespace-nowrap font-mono text-xs text-dim">
          <span className="min-w-0 truncate">{live && bot.currentAction ? bot.currentAction : "—"}</span>
          <span>· {live ? BOTS_TEXT.perMin(bot.actionsPerMin.toFixed(1)) : "—"}</span>
          <span className={errorClass(bot.errorRate)}>
            · {bot.total ? BOTS_TEXT.errShort(bot.errorRate.toFixed(1)) : "—"}
          </span>
        </div>
      </div>
      <BotSwitch
        app={app}
        bot={bot}
      />
    </div>
  );
};

export default BotListRow;
