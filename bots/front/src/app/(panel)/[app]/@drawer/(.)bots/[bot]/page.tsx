import BotDrawer from "@components/panel/drawer/BotDrawer";
import { pageData } from "@lib/api/server";

import type { BotDetailView } from "@contracts/interfaces/panelTypes";

/**
 * `/[app]/bots/[bot]` intercepted from inside the app: the drawer over whatever page was open.
 * `(.)`: route groups and slots are not URL segments, so this sits level with `bots/`.
 */
const InterceptedBotPage = async ({ params }: PageProps<"/[app]/bots/[bot]">) => {
  const { app, bot } = await params;
  const detail = await pageData<BotDetailView>(`/apps/${encodeURIComponent(app)}/bots/${encodeURIComponent(bot)}`);
  return (
    <BotDrawer
      app={app}
      bot={detail}
      intercepted
    />
  );
};

export default InterceptedBotPage;
