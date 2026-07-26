import { getServerSession } from "@auth/server/getServerSession";
import LoginFormClient from "@components/login/LoginFormClient";
import { ROUTES } from "@components/shared/config/constants";
import { redirect } from "next/navigation";

import type { AuthResponse } from "@auth/interfaces/authTypes";

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
