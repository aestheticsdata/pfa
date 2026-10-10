"use client";

import AppLogo from "@components/brand/AppLogo";
import useScrollLock from "@components/hooks/useScrollLock";
import NavCount from "@components/panel/topBar/NavCount";
import RefreshedAt from "@components/panel/topBar/RefreshedAt";
import SignOutButton from "@components/panel/topBar/SignOutButton";
import Button from "@components/ui/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { cx } from "@lib/classNames/cx";
import { appPath } from "@lib/panel/routes";
import { PANEL_TEXT } from "@text/panel";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { MobileMenuProps } from "@components/panel/topBar/interfaces/topBarTypes";

/**
 * Phone only: ☰ opens a sheet from the top with the five pages (48px rows), host and refresh time,
 * the account and Sign out. A sheet, not a bottom tab bar: the bottom edge belongs to the bulk bar
 * and the purge sheet (handoff v5).
 */
const MobileMenu = ({ app, items, refreshedAt, email }: MobileMenuProps) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={PANEL_TEXT.menu}
        aria-expanded={open}
        data-testid="menu-button"
        onClick={() => setOpen(true)}
        className="grid size-10 shrink-0 place-items-center rounded-ctl border border-line bg-panel p-0 text-heading leading-none tablet:hidden"
      >
        ☰
      </button>
      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-13 bg-scrim"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={PANEL_TEXT.menu}
            className="fixed inset-x-0 top-0 z-14 max-h-dvh overflow-y-auto overscroll-y-none rounded-b-card border-b border-line bg-panel pb-1.5 shadow-float"
          >
            <div className="flex min-h-14.25 items-center gap-2.25 border-b border-line-soft px-gut py-2 text-sm font-semibold tracking-figure">
              <AppLogo
                app={app}
                size={22}
              />
              {app.name}
              <span className="flex-1" />
              <Button
                variant={BUTTON_VARIANT.ghost}
                size={BUTTON_SIZE.icon}
                aria-label={PANEL_TEXT.closeMenu}
                onClick={() => setOpen(false)}
              >
                ✕
              </Button>
            </div>
            <nav className="flex flex-col gap-0.5 px-sheet-nav py-2">
              {items.map((item) => {
                const href = appPath(app.id, item.view);
                return (
                  <Link
                    key={item.view}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "flex min-h-12 items-center justify-between gap-2.5 rounded-ctl px-2.5 text-title font-medium no-underline",
                      pathname.startsWith(href) ? "bg-panel2 text-text" : "text-muted",
                    )}
                  >
                    <span>{item.label}</span>
                    <NavCount item={item} />
                  </Link>
                );
              })}
            </nav>
            <p className="m-0 border-t border-line-soft px-gut pt-3 pb-1 font-mono text-xs text-dim">
              {app.host} · {PANEL_TEXT.refreshed} <RefreshedAt iso={refreshedAt} />
            </p>
            <div className="flex items-center gap-2.5 px-gut py-2">
              <span className="grid size-7 place-items-center rounded-full border border-line bg-panel text-tiny font-medium text-muted">
                {(email[0] ?? "?").toUpperCase()}
              </span>
              <span
                className="min-w-0 flex-1 truncate font-mono text-note text-muted"
                title={email}
              >
                {email}
              </span>
              <SignOutButton variant={BUTTON_VARIANT.default} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileMenu;
