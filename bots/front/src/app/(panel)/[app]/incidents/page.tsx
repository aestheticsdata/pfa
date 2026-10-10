import IncidentsCard from "@components/panel/incidents/IncidentsCard";
import PushCard from "@components/panel/incidents/PushCard";
import { pageData } from "@lib/api/server";

import type { IncidentsView, PushState } from "@contracts/interfaces/panelTypes";

const IncidentsPage = async ({ params }: PageProps<"/[app]/incidents">) => {
  const { app } = await params;
  const [view, push] = await Promise.all([
    pageData<IncidentsView>(`/apps/${encodeURIComponent(app)}/incidents`),
    pageData<PushState>("/push"),
  ]);
  return (
    <>
      <IncidentsCard view={view} />
      <PushCard push={push} />
    </>
  );
};

export default IncidentsPage;
