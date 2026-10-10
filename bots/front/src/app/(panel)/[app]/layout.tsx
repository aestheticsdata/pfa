import IncidentBanner from "@components/panel/banner/IncidentBanner";
import LiveRefresh from "@components/panel/shared/LiveRefresh";
import PanelBoundary from "@components/panel/shared/PanelBoundary";
import PanelFooter from "@components/panel/shared/PanelFooter";
import ToastHost from "@components/panel/shared/ToastHost";
import TopBar from "@components/panel/topBar/TopBar";
import { pageData, SIGN_IN_EXPIRED } from "@lib/api/server";
import { readAuthState } from "@lib/auth/authState";
import { themeClass } from "@lib/panel/theme";
import { redirect } from "next/navigation";

import type { PanelHeader } from "@contracts/interfaces/panelTypes";

/**
 * Inside one app: its theme (the whole panel switches to the app's tokens), the top bar, the
 * incident banner on every page, and the two overlay slots — `@drawer` (a bot) and `@modal`
 * (disable / purge) — both parallel routes, intercepted from inside the app. Re-read every 2 s.
 */
const AppLayout = async ({ children, drawer, modal, params }: LayoutProps<"/[app]">) => {
  const { app } = await params;
  const [auth, header] = await Promise.all([
    readAuthState(),
    pageData<PanelHeader>(`/apps/${encodeURIComponent(app)}/header`),
  ]);
  if (!auth.signedIn || !auth.email) redirect(SIGN_IN_EXPIRED);

  return (
    <div className={`${themeClass(header.app.theme)} min-h-dvh bg-bg font-sans text-text`}>
      <TopBar
        header={header}
        email={auth.email}
      />
      <main className="px-gut pb-10">
        <IncidentBanner
          app={header.app.id}
          host={header.app.host}
          incidents={header.incidents}
        />
        <PanelBoundary>{children}</PanelBoundary>
        <PanelFooter allowedIps={header.app.allowedIps} />
      </main>
      {drawer}
      {modal}
      <LiveRefresh />
      <ToastHost />
    </div>
  );
};

export default AppLayout;
