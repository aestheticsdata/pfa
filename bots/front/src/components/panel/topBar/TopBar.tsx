import AppSwitcher from "@components/panel/topBar/AppSwitcher";
import MobileMenu from "@components/panel/topBar/MobileMenu";
import NavTabs from "@components/panel/topBar/NavTabs";
import { navItems } from "@components/panel/topBar/navItems";
import RefreshedAt from "@components/panel/topBar/RefreshedAt";
import SignOutButton from "@components/panel/topBar/SignOutButton";
import StatusPill from "@components/panel/topBar/StatusPill";
import UserMenu from "@components/panel/topBar/UserMenu";
import { PANEL_TEXT } from "@text/panel";

import type { TopBarProps } from "@components/panel/topBar/interfaces/topBarTypes";

/**
 * One row on desktop: BOT-RUNNER │ switcher │ tabs … status · host · refreshed · email · Sign out.
 * Tablet: two rows (tabs below), email and Sign out behind the avatar. Phone: switcher, status dot, ☰.
 * Fixed to the top of the page while it scrolls; layered above the phone's bulk bar (so the ☰ sheet
 * covers it) and under the drawer and the modal.
 */
const TopBar = ({ header, email }: TopBarProps) => {
  const items = navItems(header);
  const { app } = header;
  return (
    <header className="rule-b sticky top-0 z-7 flex flex-nowrap bg-bg items-center gap-2 px-gut py-2 tablet:flex-wrap tablet:gap-x-3.5 tablet:gap-y-3 desktop:flex-nowrap">
      <span className="hidden items-center gap-2.5 whitespace-nowrap font-mono text-tiny font-semibold uppercase tracking-brand text-dim after:h-5 after:w-px after:bg-line tablet:flex">
        {PANEL_TEXT.wordmark}
      </span>
      <AppSwitcher
        app={app}
        apps={header.apps}
      />
      <span className="hidden h-5 w-px bg-line desktop:block" />
      <NavTabs
        app={app.id}
        items={items}
      />
      <StatusPill running={app.running} />
      <span className="hidden whitespace-nowrap font-mono text-xs text-dim xl:inline">
        {app.host} · {PANEL_TEXT.refreshed} <RefreshedAt iso={header.refreshedAt} />
      </span>
      <span
        className="hidden max-w-50 truncate font-mono text-xs text-dim desktop:inline"
        title={PANEL_TEXT.signedIn}
      >
        {email}
      </span>
      <SignOutButton className="hidden desktop:block" />
      <UserMenu email={email} />
      <MobileMenu
        app={app}
        items={items}
        refreshedAt={header.refreshedAt}
        email={email}
      />
    </header>
  );
};

export default TopBar;
