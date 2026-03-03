import { redirect } from "next/navigation";
import { buildDashboardPath } from "@helpers/dateRoute";

export default function Home() {
  redirect(buildDashboardPath());
}
