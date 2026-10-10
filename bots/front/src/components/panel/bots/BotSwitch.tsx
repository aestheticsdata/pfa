"use client";

import useApply from "@components/hooks/useApply";
import Switch from "@components/ui/Switch";
import { BOT_VIEW_STATE } from "@contracts/panel";
import { setBots } from "@lib/panel/panelActions";
import { BOTS_TEXT } from "@text/bots";

import type { BotSwitchProps } from "@components/panel/bots/interfaces/botsTypes";

/** A bot's own on/off; a blocked bot (disabled or purged account) can't be turned back on. */
const BotSwitch = ({ app, bot }: BotSwitchProps) => {
  const { pending, apply } = useApply();
  const blocked = bot.state === BOT_VIEW_STATE.blocked;
  return (
    <Switch
      small
      on={bot.enabled && !blocked}
      disabled={blocked || pending}
      label={BOTS_TEXT.toggle(bot.id)}
      testId={`bot-switch-${bot.id}`}
      onToggle={() =>
        apply(
          () => setBots({ app, ids: [bot.id], enabled: !bot.enabled }),
          (bot.enabled ? BOTS_TEXT.turnedOff : BOTS_TEXT.turnedOn)(1),
        )
      }
    />
  );
};

export default BotSwitch;
