import BotsPageContent from "@components/panel/bots/BotsPageContent";
import BotDrawer from "@components/panel/drawer/BotDrawer";
import { pageData } from "@lib/api/server";

import type { BotDetailView } from "@contracts/interfaces/panelTypes";

/** A bot's URL loaded directly (reload, shared link): the Bots page with its drawer open. */
const BotPage = async ({ params, searchParams }: PageProps<"/[app]/bots/[bot]">) => {
  const [{ app, bot }, query] = await Promise.all([params, searchParams]);
  const detail = await pageData<BotDetailView>(`/apps/${encodeURIComponent(app)}/bots/${encodeURIComponent(bot)}`);
  return (
    <>
      <BotsPageContent
        app={app}
        searchParams={query}
        focused={bot}
      />
      <BotDrawer
        app={app}
        bot={detail}
        intercepted={false}
      />
    </>
  );
};

export default BotPage;
