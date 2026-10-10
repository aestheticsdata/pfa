"use client";

import useDismiss from "@components/hooks/useDismiss";
import SignOutButton from "@components/panel/topBar/SignOutButton";
import { PANEL_TEXT } from "@text/panel";
import { useRef, useState } from "react";

import type { UserMenuProps } from "@components/panel/topBar/interfaces/topBarTypes";

/** Tablet only: email and Sign out folded behind an avatar button. */
const UserMenu = ({ email }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, open, () => setOpen(false));
  return (
    <div
      ref={root}
      className="relative hidden tablet:block desktop:hidden"
    >
      <button
        type="button"
        aria-label={PANEL_TEXT.account}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-8.5 items-center gap-1.5 rounded-full border border-line bg-panel pr-2.25 pl-0.75 hover:border-faint"
      >
        <span className="grid size-6.5 place-items-center rounded-full bg-panel2 text-tiny font-medium text-muted">
          {(email[0] ?? "?").toUpperCase()}
        </span>
        <span className="text-caret text-dim">▼</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-10 right-0 z-15 min-w-60 overscroll-y-none rounded-menu border border-line bg-panel p-1.5 shadow-float"
        >
          <p className="m-0 px-2 pt-1.5 pb-1 text-tiny font-medium uppercase tracking-label text-dim">
            {PANEL_TEXT.signedIn}
          </p>
          <p
            className="m-0 truncate px-2 pt-0.5 pb-1.5 font-mono text-note text-text"
            title={email}
          >
            {email}
          </p>
          <div className="my-1.5 h-px bg-line-soft" />
          <SignOutButton menuItem />
        </div>
      )}
    </div>
  );
};

export default UserMenu;
