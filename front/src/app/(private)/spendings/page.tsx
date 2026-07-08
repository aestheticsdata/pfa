import { redirect } from "next/navigation";
import SpendingPageClient from "@components/spendings/view/SpendingPageClient";
import {
  DATE_QUERY_PARAM,
  buildSpendingsPath,
  isValidIsoDate,
} from "@helpers/dateRoute";

interface SpendingsPageProps {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}

const resolveSearchParams = async (
  searchParams: SpendingsPageProps["searchParams"],
): Promise<Record<string, string | string[] | undefined>> => {
  if (searchParams instanceof Promise) {
    return await searchParams;
  }
  return searchParams;
};

export default async function SpendingsPage({ searchParams }: SpendingsPageProps) {
  const params = await resolveSearchParams(searchParams);
  const rawDate = params[DATE_QUERY_PARAM];
  const date = typeof rawDate === "string" ? rawDate : undefined;

  if (!isValidIsoDate(date)) {
    redirect(buildSpendingsPath());
  }

  return <SpendingPageClient />;
}
