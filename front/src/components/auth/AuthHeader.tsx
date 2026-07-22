"use client";

import Logo from "@components/shared/brand/Logo";
import Wordmark from "@components/shared/brand/Wordmark";
import { ROUTES } from "@components/shared/config/constants";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { Info, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Dictionary } from "@text/index";
import type { LucideIcon } from "lucide-react";

type Tab = { path: string; label: (header: Dictionary["login"]["header"]) => string; icon: LucideIcon };

const TABS: Tab[] = [
  { path: ROUTES.login.path, label: () => "Login", icon: LogIn },
  { path: ROUTES.signup.path, label: () => "Signup", icon: UserPlus },
  { path: ROUTES.about.path, label: (header) => header.aboutTab, icon: Info },
];

const normalize = (p: string) => p.replace(/\/+$/, "") || "/";

/** Dedicated auth-screen header: brand + Login / Signup / About tabs. */
export default function AuthHeader() {
  const pathname = usePathname();
  const { header } = useTranslations("login");

  return (
    <header className="relative z-[2] flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:gap-x-6.5 sm:px-8 sm:py-4.5">
      <div className="flex items-center gap-1 text-ink">
        <Logo size={26} />
        <Wordmark />
      </div>

      <nav className="flex flex-wrap gap-1">
        {TABS.map(({ path, label, icon: Icon }) => {
          const active = normalize(pathname) === normalize(path);
          return (
            <Link
              key={path}
              href={path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-sm px-3.5 py-2 text-sm font-medium transition-colors",
                active ? "text-ink" : "text-ink-3 hover:bg-white/[0.03] hover:text-ink-2",
              )}
            >
              <Icon
                className="size-3.5"
                strokeWidth={2}
              />
              {label(header)}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-3 bottom-px h-0.5 rounded-full [background:linear-gradient(90deg,oklch(0.84_0.14_148),oklch(0.78_0.13_200))]"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
