import { redirect } from "next/navigation";
import DashboardPageClient from "./DashboardPageClient";
import {
  DATE_QUERY_PARAM,
  buildDashboardPath,
  isValidIsoDate,
} from "@helpers/dateRoute";

interface DashboardPageProps {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}

const resolveSearchParams = async (
  searchParams: DashboardPageProps["searchParams"],
): Promise<Record<string, string | string[] | undefined>> => {
  if (searchParams instanceof Promise) {
    return await searchParams;
  }
  return searchParams;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await resolveSearchParams(searchParams);
  const rawDate = params[DATE_QUERY_PARAM];
  const date = typeof rawDate === "string" ? rawDate : undefined;

  if (!isValidIsoDate(date)) {
    redirect(buildDashboardPath());
  }

  return <DashboardPageClient />;
}
