export interface BotsPageContentProps {
  app: string;
  searchParams: Record<string, string | string[] | undefined>;
  focused?: string | null;
}
