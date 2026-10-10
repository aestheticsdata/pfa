import CloseAccountModal from "@components/panel/closeAccount/CloseAccountModal";
import { loadCloseTarget } from "@components/panel/closeAccount/loadCloseTarget";

/** "Disable / purge" intercepted from inside the app: the modal over the page (or over the drawer). */
const InterceptedClosePage = async ({ params, searchParams }: PageProps<"/[app]/close/[bot]">) => {
  const [{ app, bot }, query] = await Promise.all([params, searchParams]);
  const incident = typeof query.incident === "string" ? query.incident : null;
  const target = await loadCloseTarget({ app, bot, incident });
  return (
    <CloseAccountModal
      app={app}
      bot={target.bot}
      incident={target.incident}
      intercepted
    />
  );
};

export default InterceptedClosePage;
