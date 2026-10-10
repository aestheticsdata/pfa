import BotsPageContent from "@components/panel/bots/BotsPageContent";

const BotsPage = async ({ params, searchParams }: PageProps<"/[app]/bots">) => {
  const [{ app }, query] = await Promise.all([params, searchParams]);
  return (
    <BotsPageContent
      app={app}
      searchParams={query}
    />
  );
};

export default BotsPage;
