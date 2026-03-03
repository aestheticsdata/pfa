"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import text from "@src/components/shared/navBar/common/text";

type NavRoute = {
  path: string;
  label: string;
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

  const getActivePath = (routePath: string): string => {
    const normalizedRoute = normalizePath(routePath);
    const normalizedPathname = normalizePath(pathname);
    const isRouteActive = normalizedPathname === normalizedRoute
      || normalizedPathname.startsWith(`${normalizedRoute}/`);

    return isRouteActive ? "bg-spendingItemHover rounded-sm text-blueNavy" : "";
  };

  const getLinkItem = (route: NavRoute) => {
    const storedDate = selectedDateIso ?? undefined;
    const href = route.path === ROUTES.spendings.path
      && isClientHydrated
      && isValidIsoDate(storedDate)
      ? buildDashboardPath(storedDate)
      : route.path;

    return (
      <Link
        href={href}
        className={`outline-hidden p-1 ${getActivePath(
          route.path
        )} hover:cursor-pointer hover:bg-spendingItemHover hover:text-blueNavy hover:rounded-sm`}
      >
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

  return (
    <div
      className={`flex md:flex-row fixed ${
        isLogged ? "h-32" : "h-14"
      } md:h-14 w-screen items-center justify-start bg-blueNavy text-white z-50`}
    >
      {/* logo desktop, comme avant */}
      <div className="mx-4 hidden md:block">
        <Image
          src="/assets/money-svgrepo-com.svg"
          alt="logo"
          width={40}
          height={40}
        />
      </div>

      {isLogged ? (
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-5 items-center justify-between font-ubuntu w-full">
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex md:space-x-4">
              {getLinkItem(ROUTES.spendings)}
              {getLinkItem(ROUTES.categories)}
              {getLinkItem(ROUTES.statistics)}
            </div>
            {isCalendarVisible && (
              <div className="flex items-center gap-2">
                <DatePickerWrapper />
                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="text-emerald-100 bg-datePickerWrapperBackground rounded-sm px-2  select-none cursor-pointer hover:brightness-125"
                >
                  {text.today}
                </button>
              </div>
            )}
          </div>
          <div className="flex">
            <UserMenu />
          </div>
        </div>
      ) : (
        <div className="flex space-x-5 font-ubuntu">
          {getLinkItem(ROUTES.login)}
          {getLinkItem(ROUTES.signup)}
          {getLinkItem(ROUTES.about)}
        </div>
      )}
    </div>
  );
};

export default NavBar;
