import { ROUTES } from "@components/shared/config/constants";
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect(ROUTES.dashboard.path);
}
