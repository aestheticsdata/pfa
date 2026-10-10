"use client";

import BotSwitch from "@components/panel/bots/BotSwitch";
import KindTag from "@components/panel/bots/KindTag";
import StatusLabel from "@components/panel/bots/StatusLabel";
import Button from "@components/ui/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { DRAWER_TEXT } from "@text/bots";

import type { DrawerHeaderProps } from "@components/panel/drawer/interfaces/drawerTypes";

/** Phone: a top bar (✕ · name · switch), then type, status and email underneath. */
const DrawerTopBar = ({ app, bot, onClose }: DrawerHeaderProps) => (
  <div className="tablet:hidden">
    <div className="flex min-h-14.25 items-center gap-2.5 border-b border-line-soft px-gut py-2">
      <Button
        variant={BUTTON_VARIANT.ghost}
        size={BUTTON_SIZE.icon}
        aria-label={DRAWER_TEXT.close}
        onClick={onClose}
      >
        ✕
      </Button>
      <h2 className="m-0 min-w-0 flex-1 truncate font-mono text-base font-semibold">{bot.id}</h2>
      <BotSwitch
        app={app}
        bot={bot}
      />
    </div>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line-soft px-gut py-3">
      <KindTag kind={bot.kind} />
      <StatusLabel state={bot.state} />
      <span className="basis-full font-mono text-xs text-dim">{bot.email}</span>
    </div>
  </div>
);

export default DrawerTopBar;
