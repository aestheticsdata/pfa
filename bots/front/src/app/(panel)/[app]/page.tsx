import { appPath } from "@lib/panel/routes";
import { PANEL_VIEW } from "@lib/panel/views";
import { redirect } from "next/navigation";

/** `/pfa` lands on its overview. */
const AppIndex = async ({ params }: PageProps<"/[app]">) => {
  const { app } = await params;
  redirect(appPath(app, PANEL_VIEW.overview));
};

export default AppIndex;
