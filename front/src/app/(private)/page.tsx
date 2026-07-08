import { redirect } from "next/navigation";
import { ROUTES } from "@components/shared/config/constants";

export default function Home() {
  redirect(ROUTES.dashboard.path);
}
