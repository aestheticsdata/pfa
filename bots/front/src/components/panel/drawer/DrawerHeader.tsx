"use client";

import BotSwitch from "@components/panel/bots/BotSwitch";
import KindTag from "@components/panel/bots/KindTag";
import StatusLabel from "@components/panel/bots/StatusLabel";
import Button from "@components/ui/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { DRAWER_TEXT } from "@text/bots";

import type { DrawerHeaderProps } from "@components/panel/drawer/interfaces/drawerTypes";

/** From 700px: name + type, email, the switch and status on the right, ✕. */
const DrawerHeader = ({ app, bot, onClose }: DrawerHeaderProps) => (
  <div className="hidden items-start gap-3 border-b border-line-soft p-3.5 tablet:flex">
    <div className="min-w-0 flex-1">
      <h2 className="m-0 flex items-center gap-2 font-mono text-heading font-semibold">
        {bot.id}
        <KindTag kind={bot.kind} />
      </h2>
      <p className="m-0 truncate font-mono text-xs text-dim">{bot.email}</p>
    </div>
    <div className="flex flex-col items-end gap-2">
      <BotSwitch
        app={app}
        bot={bot}
      />
      <StatusLabel state={bot.state} />
    </div>
    <Button
      variant={BUTTON_VARIANT.ghost}
      size={BUTTON_SIZE.sm}
      aria-label={DRAWER_TEXT.close}
      onClick={onClose}
    >
      ✕
    </Button>
  </div>
);

export default DrawerHeader;
