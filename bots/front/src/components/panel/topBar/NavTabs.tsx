"use client";

import NavCount from "@components/panel/topBar/NavCount";
import { cx } from "@lib/classNames/cx";
import { appPath } from "@lib/panel/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavTabsProps } from "@components/panel/topBar/interfaces/topBarTypes";

/**
 * The page tabs. Desktop: inline, between the switcher and the status. Tablet: a full-width second
 * row that scrolls sideways without a bar. Phone: hidden (they live in the ☰ sheet).
 */
const NavTabs = ({ app, items }: NavTabsProps) => {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Pages"
      className="no-scrollbar order-10 -mx-1.5 hidden basis-full gap-0.5 overflow-x-auto overscroll-x-contain tablet:flex desktop:order-none desktop:mx-0 desktop:min-w-0 desktop:flex-1 desktop:basis-0"
    >
      {items.map((item) => {
        const href = appPath(app, item.view);
        const current = pathname.startsWith(href);
        return (
          <Link
            key={item.view}
            href={href}
            aria-current={current ? "page" : undefined}
            data-testid={`nav-${item.view}`}
            className={cx(
              "flex shrink-0 items-center gap-1.75 rounded-ctl px-3 py-1.5 text-body font-medium no-underline",
              current ? "bg-panel text-text" : "text-dim hover:text-muted",
            )}
          >
            {item.label}
            <NavCount item={item} />
          </Link>
        );
      })}
    </nav>
  );
};

export default NavTabs;
