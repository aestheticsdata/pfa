"use client";

import AccountAvatar from "@components/shared/navBar/userMenu/AccountAvatar";
import useAccountActions from "@components/shared/navBar/userMenu/useAccountActions";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@i18n/config";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { Check, ChevronDown, Globe, KeyRound, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

// Mirrors the drawer nav links so the account rows read as part of the same list.
const DRAWER_ROW =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-ink-3 transition-colors hover:bg-white/[0.05] hover:text-ink";

type DrawerAccountSectionProps = {
  drawerOpen: boolean;
  onNavigate: () => void;
};

/**
 * Mobile-only account block, pinned to the bottom of the drawer (`mt-auto`).
 * Below `lg` the header dropdown is hidden: its nested "Langue" submenu had no
 * room to open next to a panel already glued to the screen edge, so it rendered
 * off-screen (COS-163).
 *
 * Standard bottom-of-sidebar pattern: one compact trigger row (avatar + email +
 * chevron) sitting at the very bottom, collapsed by default; tapping it unfolds
 * the actions above it, with the locales listed flat — no nested submenu.
 */
const DrawerAccountSection = ({ drawerOpen, onNavigate }: DrawerAccountSectionProps) => {
  const { email, initials, locale, updateLanguage, goToChangePassword, logout } = useAccountActions();
  const text = useTranslations("navBar");
  const [expanded, setExpanded] = useState(false);

  // The drawer stays mounted while closed (it slides off-screen), so fold the
  // menu back when it closes; reopening always starts from the compact row.
  useEffect(() => {
    if (!drawerOpen) setExpanded(false);
  }, [drawerOpen]);

  const handleChangePassword = () => {
    goToChangePassword();
    onNavigate();
  };

  return (
    <div className="mt-auto flex flex-col gap-0.5 border-t border-white/[0.07] pt-2">
      {expanded && (
        <>
          <button
            type="button"
            onClick={handleChangePassword}
            className={DRAWER_ROW}
          >
            <KeyRound className="size-4 text-primary" />
            {text.userMenu.changePassword}
          </button>

          <div className="flex items-center gap-2.5 px-3 pt-2 pb-1 text-2xs font-medium uppercase tracking-caps text-ink-4">
            <Globe className="size-4 text-primary" />
            {text.userMenu.language}
          </div>
          {SUPPORTED_LOCALES.map((availableLocale) => {
            const isActive = availableLocale === locale;
            return (
              <button
                key={availableLocale}
                type="button"
                aria-pressed={isActive}
                onClick={() => updateLanguage(availableLocale)}
                className={cn(DRAWER_ROW, "pl-10", isActive && "text-ink")}
              >
                {LOCALE_LABELS[availableLocale]}
                {isActive && <Check className="ml-auto size-4 text-primary" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={logout}
            className={DRAWER_ROW}
          >
            <LogOut className="size-4 text-ink-3" />
            {text.userMenu.logout}
          </button>
        </>
      )}

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-2 transition-colors hover:bg-white/[0.05]"
      >
        <AccountAvatar initials={initials} />
        <span className="truncate text-sm text-ink-2">{email}</span>
        <ChevronDown
          className={cn(
            "ml-auto size-4 flex-shrink-0 text-ink-4 transition-transform duration-200",
            // Menu unfolds upward, so the closed chevron points up and flips down once open.
            expanded ? "rotate-0" : "rotate-180",
          )}
        />
      </button>
    </div>
  );
};

export default DrawerAccountSection;
