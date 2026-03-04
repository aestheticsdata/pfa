import NavBar from "@components/shared/navBar/NavBar";
import { AuthProvider } from "@auth/context/AuthContext";
import { getServerSession } from "@auth/server/getServerSession";

import type { AuthResponse } from "@auth/types";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: AuthResponse | null = null;
  try {
    session = await getServerSession();
  } catch {
    session = null;
  }

  return (
    <AuthProvider initialUser={session?.user ?? null} initialCsrfToken={session?.csrfToken ?? null}>
      <div className="flex min-h-screen w-full flex-col items-center bg-grey1">
        <NavBar />
        {children}
      </div>
    </AuthProvider>
  );
}
