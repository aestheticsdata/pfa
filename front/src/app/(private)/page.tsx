import { ROUTES } from "@components/shared/config/constants";
import { redirect } from "next/navigation";

export default function Home() {
  redirect(ROUTES.dashboard.path);
}
