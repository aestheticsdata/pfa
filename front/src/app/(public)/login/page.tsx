import { redirect } from "next/navigation";
import { getServerSession } from "@auth/server/getServerSession";
import { ROUTES } from "@components/shared/config/constants";
import LoginFormClient from "@components/login/LoginFormClient";

import type { AuthResponse } from "@auth/types";

export default async function LoginPage() {
  let session: AuthResponse | null = null;
  try {
    session = await getServerSession();
  } catch {
    // If API is unreachable, keep login accessible.
  }

  if (session) {
    redirect(ROUTES.dashboard.path);
  }

  return <LoginFormClient />;
}
