import ActionsCard from "@components/panel/actions/ActionsCard";
import { pageData } from "@lib/api/server";

import type { ActionsView, OverviewView } from "@contracts/interfaces/panelTypes";

const ActionsPage = async ({ params }: PageProps<"/[app]/actions">) => {
  const { app } = await params;
  const base = `/apps/${encodeURIComponent(app)}`;
  const [view, overview] = await Promise.all([
    pageData<ActionsView>(`${base}/actions`),
    pageData<OverviewView>(`${base}/overview`),
  ]);
  return (
    <ActionsCard
      app={app}
      view={view}
      running={overview.status.running}
    />
  );
};

export default ActionsPage;
