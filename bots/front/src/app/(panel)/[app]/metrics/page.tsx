import MetricsView from "@components/panel/metrics/MetricsView";
import { pageData } from "@lib/api/server";

import type { MetricsView as Metrics } from "@contracts/interfaces/panelTypes";

const MetricsPage = async ({ params }: PageProps<"/[app]/metrics">) => {
  const { app } = await params;
  const view = await pageData<Metrics>(`/apps/${encodeURIComponent(app)}/metrics`);
  return <MetricsView view={view} />;
};

export default MetricsPage;
