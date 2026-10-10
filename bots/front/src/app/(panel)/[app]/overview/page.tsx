import OverviewView from "@components/panel/overview/OverviewView";
import { pageData } from "@lib/api/server";

import type { AppSummary, OverviewView as Overview } from "@contracts/interfaces/panelTypes";

const OverviewPage = async ({ params }: PageProps<"/[app]/overview">) => {
  const { app } = await params;
  const base = `/apps/${encodeURIComponent(app)}`;
  const [view, apps] = await Promise.all([pageData<Overview>(`${base}/overview`), pageData<AppSummary[]>("/apps")]);
  const summary = apps.find((entry) => entry.id === app);
  return (
    <OverviewView
      app={app}
      appName={summary?.name ?? app}
      configured={summary?.configured ?? true}
      view={view}
    />
  );
};

export default OverviewPage;
