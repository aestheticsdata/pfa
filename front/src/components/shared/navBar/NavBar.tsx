"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@auth/context/AuthContext";
import DatePickerWrapper from "@components/datePickerWrapper/DatePickerWrapper";
import useGlobalStore from "@components/shared/globalStore";
import UserMenu from "@components/shared/navBar/userMenu/UserMenu";
import { ROUTES } from "@components/shared/config/constants";

const NavBar = () => {
  const { user } = useAuth();
  const { isCalendarVisible } = useGlobalStore();
  const pathname = usePathname();

  const getActivePath = (route: string) =>
    route === pathname ? "bg-spendingItemHover rounded-sm text-blueNavy" : "";

  const getLinkItem = (route: { path: string; label: string }) => {
    // Désactiver le prefetch pour les routes qui causent des erreurs 403 ou Mixed Content
    // avec l'export statique de Next.js (routes protégées et certaines routes publiques)
    const routesWithoutPrefetch = ["/", "/statistics", "/categories", "/about", "/signup", "/login", "/forgotPassword"];
    const shouldDisablePrefetch = routesWithoutPrefetch.includes(route.path);
    
    return (
      <Link
        href={route.path}
        prefetch={!shouldDisablePrefetch}
        className={`outline-hidden p-1 ${getActivePath(
          route.path
        )} hover:cursor-pointer hover:bg-spendingItemHover hover:text-blueNavy hover:rounded-sm`}
      >
        {route.label}
      </Link>
    );
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
            {isCalendarVisible && <DatePickerWrapper />}
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
