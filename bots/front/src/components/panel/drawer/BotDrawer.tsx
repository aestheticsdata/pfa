"use client";

import useMediaQuery from "@components/hooks/useMediaQuery";
import useScrollLock from "@components/hooks/useScrollLock";
import DrawerBody from "@components/panel/drawer/DrawerBody";
import DrawerFooter from "@components/panel/drawer/DrawerFooter";
import DrawerHeader from "@components/panel/drawer/DrawerHeader";
import DrawerTopBar from "@components/panel/drawer/DrawerTopBar";
import { appPath } from "@lib/panel/routes";
import { PANEL_VIEW } from "@lib/panel/views";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { BotDrawerProps } from "@components/panel/drawer/interfaces/drawerTypes";

/**
 * A bot's drawer: 460px from the right over a dimmed page; full screen on a phone (page scroll
 * locked). A parallel-route slot: the URL is the bot's, Back closes it, a reload shows it again.
 */
const BotDrawer = ({ app, bot, intercepted }: BotDrawerProps) => {
  const router = useRouter();
  const phone = useMediaQuery("(max-width: 699.98px)");
  useScrollLock(phone);
  const close = () => (intercepted ? router.back() : router.push(appPath(app, PANEL_VIEW.bots), { scroll: false }));
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-8 bg-scrim"
        onClick={close}
      />
      <aside
        role="dialog"
        aria-label={bot.id}
        data-testid="bot-drawer"
        className="fixed inset-y-0 right-0 z-9 flex w-full flex-col overflow-hidden bg-panel tablet:w-drawer tablet:border-l tablet:border-line"
      >
        <DrawerHeader
          app={app}
          bot={bot}
          onClose={close}
        />
        <DrawerTopBar
          app={app}
          bot={bot}
          onClose={close}
        />
        <DrawerBody
          app={app}
          bot={bot}
        />
        <DrawerFooter
          app={app}
          bot={bot}
        />
      </aside>
    </>
  );
};

export default BotDrawer;
