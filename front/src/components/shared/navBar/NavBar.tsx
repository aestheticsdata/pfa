"use client";

import { useAuth } from "@auth/context/AuthContext";
import MonthSelector from "@components/dashboard/MonthSelector";
import DatePickerWrapper from "@components/datePickerWrapper/DatePickerWrapper";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import Logo from "@components/shared/brand/Logo";
import Wordmark from "@components/shared/brand/Wordmark";
import { ROUTES } from "@components/shared/config/constants";
import useGlobalStore from "@components/shared/globalStore";
import { IconButton } from "@components/shared/IconButton";
import DrawerAccountSection from "@components/shared/navBar/userMenu/DrawerAccountSection";
import UserMenu from "@components/shared/navBar/userMenu/UserMenu";
import {
  buildDashboardPath,
  buildSpendingsPath,
  formatIsoDate,
  formatMonthParam,
  getTodayIsoDate,
  isValidIsoDate,
  isValidMonthParam,
  MONTH_QUERY_PARAM,
  parseMonthParam,
  SPENDINGS_PATH,
} from "@helpers/dateRoute";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import parseISO from "date-fns/parseISO";
import startOfMonth from "date-fns/startOfMonth";
import { BarChart3, LayoutDashboard, Menu, Receipt, Sparkles, Tag, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState, useSyncExternalStore } from "react";

import type { NavLabelKey } from "@components/shared/config/constants";
import type { LucideIcon } from "lucide-react";

type NavRoute = { path: string; labelKey: NavLabelKey };

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
  const text = useTranslations("navBar");
  const { user } = useAuth();
  const { isCalendarVisible } = useGlobalStore();
  const { selectedDateIso, setScrollToDayIso } = useDatePickerWrapperStore();
  const pathname = usePathname();
  const router = useRouter();
  const [monthParam, setMonthParam] = useQueryState(MONTH_QUERY_PARAM, parseAsString);
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

  // "Current month" shortcut on the Dashboard: always shown, but disabled while
  // already on the current month (COS-118) — it stays put and greys out instead
  // of disappearing. Client-only (isClientHydrated) so `new Date()` never runs on
  // the server (COS-73) and can't cause a hydration mismatch; before hydration it
  // renders disabled, matching SSR.
  const currentMonthDisabled =
    !isClientHydrated ||
    !isValidMonthParam(monthParam ?? "") ||
    (monthParam ?? "") === formatMonthParam(startOfMonth(new Date()));

  const goToCurrentMonth = () => setMonthParam(null);

  const currentMonthButtonClass = cn(
    PERIOD_BTN,
    "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:text-ink-2",
  );

  const hrefFor = (route: NavRoute): string => {
    const storedDate = selectedDateIso ?? undefined;
    if (route.path === ROUTES.spendings.path && isClientHydrated) {
      // On the Dashboard, the Spendings link follows the viewed month (?month=) so
      // "Current month" / month stepping can't strand you on an old searched week
      // (COS-119). Keep the exact selected day when it falls inside that month;
      // otherwise today for the current month, else the month's first day.
      if (isDashboard) {
        const currentMonth = formatMonthParam(startOfMonth(new Date()));
        const rawMonth = monthParam ?? "";
        const dashMonth = isValidMonthParam(rawMonth) ? rawMonth : currentMonth;
        if (isValidIsoDate(storedDate) && formatMonthParam(parseISO(storedDate)) === dashMonth) {
          return buildSpendingsPath(storedDate);
        }
        return buildSpendingsPath(
          dashMonth === currentMonth ? getTodayIsoDate() : formatIsoDate(parseMonthParam(dashMonth)),
        );
      }
      if (isValidIsoDate(storedDate)) {
        return buildSpendingsPath(storedDate);
      }
    }
    // The Dashboard link carries the month of the currently selected week, so
    // jumping from a past week lands on that month's dashboard (COS-118). The
    // current month links to a clean /dashboard.
    if (route.path === ROUTES.dashboard.path && isClientHydrated && isValidIsoDate(storedDate)) {
      const weekMonth = formatMonthParam(startOfMonth(parseISO(storedDate)));
      return weekMonth === formatMonthParam(startOfMonth(new Date()))
        ? ROUTES.dashboard.path
        : buildDashboardPath(weekMonth);
    }
    return route.path;
  };

  const handleGoToToday = () => {
    const today = getTodayIsoDate();
    // Ask the timeline to scroll to today's card. Set this before the
    // early-return below: when we are already on the current week no navigation
    // happens, so the scroll request is the only thing that recenters the view
    // (COS-38). Shared by both the desktop and mobile "Today" buttons.
    setScrollToDayIso(today);
    if (normalizePath(pathname) === SPENDINGS_PATH && selectedDateIso === today) {
      return;
    }
    router.push(buildSpendingsPath(today));
  };

  if (!user) return null;

  // Wordmark is hidden on mobile in the top bar (icon only there); the drawer
  // keeps it, so mobile users still see it in the open sidebar.
  const renderBrand = (wordmarkClassName?: string) => (
    <div className="flex items-center gap-1 text-ink">
      <Logo size={24} />
      <Wordmark className={wordmarkClassName} />
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

        {renderBrand("hidden lg:inline")}

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
              {text.links[route.labelKey]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {isDashboard ? (
            <div className="hidden items-center gap-2 md:flex">
              <MonthSelector />
              <button
                type="button"
                onClick={goToCurrentMonth}
                disabled={currentMonthDisabled}
                className={currentMonthButtonClass}
              >
                {text.currentMonth}
              </button>
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
          {/* Below lg the same actions live at the bottom of the drawer (COS-163). */}
          <div className="hidden lg:block">
            <UserMenu />
          </div>
        </div>

        {isDashboard ? (
          <div className="flex w-full flex-col gap-2 md:hidden">
            {/* Stacked like the Dépenses variant below: side by side, the button
                overflowed the viewport on narrow screens (COS-163). */}
            <MonthSelector />
            <button
              type="button"
              onClick={goToCurrentMonth}
              disabled={currentMonthDisabled}
              className={cn(currentMonthButtonClass, "self-start")}
            >
              {text.currentMonth}
            </button>
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
          {renderBrand()}
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
                {text.links[route.labelKey]}
              </Link>
            );
          })}
        </nav>
        <DrawerAccountSection
          drawerOpen={drawerOpen}
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>
    </>
  );
};

export default NavBar;
