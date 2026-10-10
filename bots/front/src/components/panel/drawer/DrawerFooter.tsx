"use client";

import useApply from "@components/hooks/useApply";
import Button from "@components/ui/Button";
import { BOT_VIEW_STATE } from "@contracts/panel";
import { restartSession } from "@lib/panel/panelActions";
import { closePath } from "@lib/panel/routes";
import { DRAWER_TEXT } from "@text/bots";
import Link from "next/link";

import type { DrawerPartProps } from "@components/panel/drawer/interfaces/drawerTypes";

/** Restart session · Disable / purge account (opens the modal, over the drawer). */
const DrawerFooter = ({ app, bot }: DrawerPartProps) => {
  const { pending, apply } = useApply();
  const blocked = bot.state === BOT_VIEW_STATE.blocked;
  const stopped = bot.state === BOT_VIEW_STATE.stopped;
  return (
    <div className="flex flex-wrap gap-2 border-t border-line-soft px-3.5 pt-3 pb-bulk tablet:pb-3">
      <Button
        disabled={blocked || stopped || pending}
        onClick={() => apply(() => restartSession(app, bot.id), DRAWER_TEXT.restarted(bot.id))}
        className="flex-auto justify-center tablet:flex-none"
      >
        {DRAWER_TEXT.restart}
      </Button>
      <span className="hidden flex-1 tablet:block" />
      <Link
        href={closePath({ app, bot: bot.id })}
        scroll={false}
        className="inline-flex h-10 flex-auto items-center justify-center gap-1.5 whitespace-nowrap rounded-ctl border border-bad/50 px-3 text-body font-medium text-bad no-underline tablet:h-8 tablet:flex-none"
      >
        {DRAWER_TEXT.close_account}
      </Link>
    </div>
  );
};

export default DrawerFooter;
