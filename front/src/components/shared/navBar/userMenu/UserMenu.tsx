"use client";

import AccountAvatar from "@components/shared/navBar/userMenu/AccountAvatar";
import useAccountActions from "@components/shared/navBar/userMenu/useAccountActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@i18n/config";
import useTranslations from "@i18n/useTranslations";
import { Check, ChevronDown, Globe, KeyRound, LogOut } from "lucide-react";

/**
 * Desktop-only (≥ lg): below that breakpoint the same actions live at the bottom
 * of the mobile drawer, where a nested submenu has no room to open (COS-163).
 */
const UserMenu = () => {
  const { email, initials, locale, updateLanguage, goToChangePassword, logout } = useAccountActions();
  const text = useTranslations("navBar");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex cursor-pointer items-center gap-2.5 rounded-md outline-hidden">
        <AccountAvatar initials={initials} />
        <span className="hidden max-w-[200px] truncate text-sm text-ink-2 xl:inline">{email}</span>
        <ChevronDown className="size-4 flex-shrink-0 text-ink-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        // Marks this panel as a navbar overlay: raises the page blur (COS-161).
        data-nav-overlay
        className="w-64 p-1"
      >
        <DropdownMenuItem
          onClick={goToChangePassword}
          className="cursor-pointer gap-3 px-3 py-2.5 text-sm text-ink-2"
        >
          <KeyRound className="size-4 text-primary" />
          {text.userMenu.changePassword}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer gap-3 px-3 py-2.5 text-sm text-ink-2">
            <Globe className="size-4 text-primary" />
            {text.userMenu.language}
            <span className="ml-auto text-ink-3">{LOCALE_LABELS[locale]}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            sideOffset={8}
            className="w-44 p-1"
          >
            {SUPPORTED_LOCALES.map((availableLocale) => (
              <DropdownMenuItem
                key={availableLocale}
                onClick={() => updateLanguage(availableLocale)}
                className="cursor-pointer gap-3 px-3 py-2.5 text-sm text-ink-2"
              >
                {LOCALE_LABELS[availableLocale]}
                {availableLocale === locale && <Check className="ml-auto size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer gap-3 px-3 py-2.5 text-sm text-ink-2"
        >
          <LogOut className="size-4 text-ink-3" />
          {text.userMenu.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
