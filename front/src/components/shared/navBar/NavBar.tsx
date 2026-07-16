"use client";

import { useAuth } from "@auth/context/AuthContext";
import MonthSelector from "@components/dashboard/MonthSelector";
import DatePickerWrapper from "@components/datePickerWrapper/DatePickerWrapper";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import Logo from "@components/shared/brand/Logo";
import { ROUTES } from "@components/shared/config/constants";
import useGlobalStore from "@components/shared/globalStore";
import { IconButton } from "@components/shared/IconButton";
import UserMenu from "@components/shared/navBar/userMenu/UserMenu";
import { buildSpendingsPath, getTodayIsoDate, isValidIsoDate, SPENDINGS_PATH } from "@helpers/dateRoute";
import { cn } from "@lib/utils";
import text from "@text/navBar";
import { BarChart3, LayoutDashboard, Menu, Receipt, Sparkles, Tag, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import type { LucideIcon } from "lucide-react";

type NavRoute = { path: string; label: string };

const NAV_ROUTES: NavRoute[] = [
  ROUTES.dashboard,
  ROUTES.spendings,
  ROUTES.exceptionals,
  ROUTES.categories,
  ROUTES.statistics,
];

const ROUTE_ICONS: Record<string, LucideIcon> = {
  [ROUTES.dashboard.path]: LayoutDashboard,
  [ROUTES.spendings.path]: Receipt,
  [ROUTES.exceptionals.path]: Sparkles,
  [ROUTES.categories.path]: Tag,
  [ROUTES.statistics.path]: BarChart3,
};

const ACTIVE_BG = "bg-[oklch(0.26_0.010_248)]";
const PERIOD_BTN =
  "cursor-pointer rounded-sm border border-[oklch(0.30_0.010_248)] bg-[oklch(0.125_0.006_250/0.55)] px-3 py-2 text-sm text-ink-2 transition-colors hover:text-ink whitespace-nowrap";

const normalizePath = (path: string): string => {
  const normalized = path.replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
};

const NavBar = () => {
  const { user } = useAuth();
  const { isCalendarVisible } = useGlobalStore();
  const { selectedDateIso, setScrollToDayIso } = useDatePickerWrapperStore();
  const pathname = usePathname();
  const router = useRouter();
  const isClientHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { aria } = text;

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const isActiveRoute = (routePath: string): boolean => {
    const nr = normalizePath(routePath);
    const np = normalizePath(pathname);
    return np === nr || np.startsWith(`${nr}/`);
  };

  // The Dashboard (/dashboard) drives a whole-MONTH period → header shows the
  // month selector; every other private page keeps the weekly date-picker.
  const isDashboard = isActiveRoute(ROUTES.dashboard.path);

  const hrefFor = (route: NavRoute): string => {
    const storedDate = selectedDateIso ?? undefined;
    return route.path === ROUTES.spendings.path && isClientHydrated && isValidIsoDate(storedDate)
      ? buildSpendingsPath(storedDate)
      : route.path;
  };

  const handleGoToToday = () => {
    const today = getTodayIsoDate();
    // Ask the timeline to scroll to today's card. Set this before the
    // early-return below: when we are already on the current week no navigation
    // happens, so the scroll request is the only thing that recenters the view
    // (COS-38). Shared by both the desktop and mobile "Aujourd'hui" buttons.
    setScrollToDayIso(today);
    if (normalizePath(pathname) === SPENDINGS_PATH && selectedDateIso === today) {
      return;
    }
    router.push(buildSpendingsPath(today));
  };

  if (!user) return null;

  const brand = (
    <div className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-ink">
      <Logo size={24} />
      <span>pfa</span>
    </div>
  );

  return (
    <>
      {/* top-4 (not 0): the layout's pt-4 scrolls away with the page, so a
          top-0 header ends up glued to the viewport edge once stuck. Matching
          the padding keeps the detached-bar look at rest AND while scrolling
          (COS-101). */}
      <header className="pfa-hdr sticky top-4 z-40 mb-7 flex flex-wrap items-center gap-x-3 gap-y-2.5 px-3.5 py-2.5">
        <IconButton
          variant="ghost"
          size={9}
          onClick={() => setDrawerOpen(true)}
          aria-label={aria.openMenu}
          className="hover:border-line lg:hidden"
        >
          <Menu />
        </IconButton>

        {brand}

        <nav className="ml-1.5 hidden gap-0.5 lg:flex">
          {NAV_ROUTES.map((route) => (
            <Link
              key={route.path}
              href={hrefFor(route)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                isActiveRoute(route.path) ? cn(ACTIVE_BG, "text-ink") : "text-ink-3 hover:text-ink-2",
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {isDashboard ? (
            <div className="hidden items-center md:flex">
              <MonthSelector />
            </div>
          ) : (
            isCalendarVisible && (
              <div className="hidden items-center gap-2 md:flex">
                <DatePickerWrapper />
                <button
                  type="button"
                  onClick={handleGoToToday}
                  className={PERIOD_BTN}
                >
                  {text.today}
                </button>
              </div>
            )
          )}
          <UserMenu />
        </div>

        {isDashboard ? (
          <div className="w-full md:hidden">
            <MonthSelector />
          </div>
        ) : (
          isCalendarVisible && (
            <div className="flex w-full flex-col gap-2 md:hidden">
              <DatePickerWrapper />
              <button
                type="button"
                onClick={handleGoToToday}
                className={`${PERIOD_BTN} self-start`}
              >
                {text.today}
              </button>
            </div>
          )
        )}
      </header>

      {/* Mobile drawer + scrim */}
      <div
        className="pfa-scrim lg:hidden"
        data-open={drawerOpen}
        aria-hidden
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className="pfa-drawer lg:hidden"
        data-open={drawerOpen}
        aria-label={aria.drawer}
        aria-hidden={!drawerOpen}
      >
        <div className="mb-1.5 flex items-center justify-between border-b border-white/[0.07] px-1.5 pb-3">
          {brand}
          <IconButton
            variant="ghost"
            size={9}
            onClick={() => setDrawerOpen(false)}
            aria-label={aria.closeMenu}
            className="hover:border-line"
          >
            <X />
          </IconButton>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV_ROUTES.map((route) => {
            const Icon = ROUTE_ICONS[route.path];
            return (
              <Link
                key={route.path}
                href={hrefFor(route)}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActiveRoute(route.path)
                    ? cn(ACTIVE_BG, "text-ink")
                    : "text-ink-3 hover:bg-white/[0.05] hover:text-ink",
                )}
              >
                {Icon && <Icon className="size-4" />}
                {route.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default NavBar;
