"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Info,
  LogIn,
  Menu,
  Receipt,
  Tag,
  UserPlus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@auth/context/AuthContext";
import DatePickerWrapper from "@components/datePickerWrapper/DatePickerWrapper";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useGlobalStore from "@components/shared/globalStore";
import UserMenu from "@components/shared/navBar/userMenu/UserMenu";
import { ROUTES } from "@components/shared/config/constants";
import {
  DASHBOARD_PATH,
  buildDashboardPath,
  getTodayIsoDate,
  isValidIsoDate,
} from "@helpers/dateRoute";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { cn } from "@lib/utils";
import text from "@src/components/shared/navBar/common/text";

type NavRoute = {
  path: string;
  label: string;
};

const ROUTE_ICONS: Record<string, LucideIcon> = {
  [ROUTES.spendings.path]: Receipt,
  [ROUTES.categories.path]: Tag,
  [ROUTES.statistics.path]: BarChart3,
  [ROUTES.login.path]: LogIn,
  [ROUTES.signup.path]: UserPlus,
  [ROUTES.about.path]: Info,
};

const normalizePath = (path: string): string => {
  const normalized = path.replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
};

const NavBar = () => {
  const { user } = useAuth();
  const { isCalendarVisible } = useGlobalStore();
  const { selectedDateIso } = useDatePickerWrapperStore();
  const pathname = usePathname();
  const router = useRouter();
  const isClientHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActiveRoute = (routePath: string): boolean => {
    const normalizedRoute = normalizePath(routePath);
    const normalizedPathname = normalizePath(pathname);
    return (
      normalizedPathname === normalizedRoute
      || normalizedPathname.startsWith(`${normalizedRoute}/`)
    );
  };

  const getLinkItem = (route: NavRoute, variant: "horizontal" | "vertical" = "horizontal") => {
    const storedDate = selectedDateIso ?? undefined;
    const href =
      route.path === ROUTES.spendings.path
      && isClientHydrated
      && isValidIsoDate(storedDate)
        ? buildDashboardPath(storedDate)
        : route.path;

    const active = isActiveRoute(route.path);
    const Icon = ROUTE_ICONS[route.path];

    return (
      <Link
        key={route.path}
        href={href}
        className={cn(
          "transition-colors whitespace-nowrap outline-hidden inline-flex items-center gap-2 font-medium",
          variant === "horizontal"
            ? cn(
                "pb-1",
                active
                  ? "text-gray-100 border-b-2 border-cyan-500"
                  : "text-gray-400 hover:text-gray-200",
              )
            : cn(
                "px-3 py-2 rounded-md",
                active
                  ? "text-gray-100 bg-cyan-500/10 border-l-2 border-cyan-500"
                  : "text-gray-300 hover:text-gray-100 hover:bg-[#151515]",
              ),
        )}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {route.label}
      </Link>
    );
  };

  const handleGoToToday = () => {
    const today = getTodayIsoDate();
    const normalizedPathname = normalizePath(pathname);

    if (normalizedPathname === DASHBOARD_PATH && selectedDateIso === today) {
      return;
    }

    router.push(buildDashboardPath(today));
  };

  const isLogged = !!user;

  const loggedRoutes = [ROUTES.spendings, ROUTES.categories, ROUTES.statistics];
  const anonymousRoutes = [ROUTES.login, ROUTES.signup, ROUTES.about];
  const visibleRoutes = isLogged ? loggedRoutes : anonymousRoutes;

  return (
    <header className="bg-gradient-to-b from-[#2a2d3a] to-[#1d2029] border-b border-gray-600/40 sticky top-0 z-50 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.9)] backdrop-blur-md w-full">
      <div className="max-w-[2000px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4 lg:gap-8 w-full">
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="text-gray-200 hover:bg-[#151515] hover:cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          <nav className="hidden lg:flex gap-4 md:gap-6 items-center">
            {visibleRoutes.map((r) => getLinkItem(r))}
          </nav>

          {isLogged && isCalendarVisible && (
            <div className="hidden md:flex items-center gap-2 flex-1 lg:flex-none justify-center lg:justify-start">
              <DatePickerWrapper />
              <Button
                type="button"
                variant="outline"
                onClick={handleGoToToday}
                className="h-auto py-2 rounded-lg bg-[#0c0c0c] border-gray-700/50 hover:bg-[#151515] text-gray-200 shadow-lg text-sm"
              >
                {text.today}
              </Button>
            </div>
          )}

          {isLogged && (
            <div className="flex items-center gap-3 ml-auto lg:ml-0">
              <Separator
                orientation="vertical"
                className="hidden lg:block h-6 bg-gray-700/50"
              />
              <UserMenu />
            </div>
          )}
        </div>

        {isLogged && isCalendarVisible && (
          <div className="flex md:hidden items-center gap-2 mt-3 w-full">
            <div className="flex-1">
              <DatePickerWrapper />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoToToday}
              className="h-auto py-2 rounded-lg bg-[#0c0c0c] border-gray-700/50 hover:bg-[#151515] text-gray-200 shadow-lg text-sm"
            >
              {text.today}
            </Button>
          </div>
        )}

        {isMobileMenuOpen && (
          <nav className="lg:hidden flex flex-col gap-1 mt-3 pt-3 border-t border-gray-700/40">
            {visibleRoutes.map((r) => getLinkItem(r, "vertical"))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default NavBar;
