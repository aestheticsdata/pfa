"use client";

import AppLogo from "@components/brand/AppLogo";
import useDismiss from "@components/hooks/useDismiss";
import Tag from "@components/ui/Tag";
import { TONE } from "@components/ui/variants";
import { appPath } from "@lib/panel/routes";
import { PANEL_VIEW } from "@lib/panel/views";
import { PANEL_TEXT } from "@text/panel";
import Link from "next/link";
import { useRef, useState } from "react";

import type { AppSwitcherProps } from "@components/panel/topBar/interfaces/topBarTypes";

/** `[logo] pfa ▼`: every app with its live bots and open incidents, then "All apps →". */
const AppSwitcher = ({ app, apps }: AppSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, open, () => setOpen(false));

  return (
    <div
      ref={root}
      className="relative mr-auto min-w-0 tablet:mr-auto desktop:mr-0"
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="app-switcher"
        onClick={() => setOpen(!open)}
        className="flex h-10 max-w-full items-center gap-2.25 rounded-ctl border border-line bg-panel pr-2.5 pl-1.5 text-sm font-semibold tracking-figure hover:border-faint tablet:h-8.5"
      >
        <AppLogo
          app={app}
          size={22}
        />
        <span className="truncate">{app.name}</span>
        <span className="ml-0.5 text-caret text-dim">▼</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-11 left-0 z-15 w-menu-mobile overscroll-y-none rounded-menu border border-line bg-panel p-1.5 shadow-float tablet:top-10 tablet:w-auto tablet:min-w-70"
        >
          <p className="m-0 px-2 pt-1.5 pb-1 text-tiny font-medium uppercase tracking-label text-dim">
            {PANEL_TEXT.switcher.title}
          </p>
          {apps.map((entry) => (
            <Link
              key={entry.id}
              role="menuitem"
              href={appPath(entry.id, PANEL_VIEW.overview)}
              onClick={() => setOpen(false)}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-ctl p-2 text-left text-text no-underline hover:bg-panel2 tablet:min-h-0"
            >
              <AppLogo
                app={entry}
                size={28}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{entry.name}</span>
                <span className="block font-mono text-xs text-dim">
                  {entry.host} · {entry.liveBots} {PANEL_TEXT.switcher.live}
                </span>
              </span>
              {entry.openIncidents > 0 && <Tag tone={TONE.bad}>{entry.openIncidents}</Tag>}
              {entry.id === app.id && <span className="text-ok">✓</span>}
            </Link>
          ))}
          <div className="my-1.5 h-px bg-line-soft" />
          {apps.length > 1 ? (
            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-ctl p-2 text-text no-underline hover:bg-panel2 tablet:min-h-0"
            >
              <span className="flex-1">{PANEL_TEXT.switcher.allApps}</span>
              <span className="text-xs text-dim">→</span>
            </Link>
          ) : (
            <p className="m-0 px-2 pt-1.5 pb-1 text-xs text-dim">
              {PANEL_TEXT.switcher.onlyOne}{" "}
              <code className="font-mono text-muted">{PANEL_TEXT.switcher.onlyOneFile}</code>{" "}
              {PANEL_TEXT.switcher.onlyOneEnd}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AppSwitcher;
