import { AuthProvider } from "@auth/context/AuthContext";
import { getServerSession } from "@auth/server/getServerSession";
import AuthHeader from "@components/auth/AuthHeader";

import type { AuthResponse } from "@auth/interfaces/authTypes";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let session: AuthResponse | null = null;
  try {
    session = await getServerSession();
  } catch {
    session = null;
  }

  return (
    <AuthProvider
      initialUser={session?.user ?? null}
      initialCsrfToken={session?.csrfToken ?? null}
    >
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-surface-base">
        <div
          className="auth-grain"
          aria-hidden
        />
        <AuthHeader />
        <main className="relative z-[1] grid flex-1 place-items-center px-6 py-8">{children}</main>
        <div className="relative z-[1] py-4.5 text-center font-mono text-2xs text-ink-4">pfa · 1991computer.com</div>
      </div>
    </AuthProvider>
  );
}
