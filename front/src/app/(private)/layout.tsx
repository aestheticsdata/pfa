import { AuthProvider } from "@auth/context/AuthContext";
import { getServerSession } from "@auth/server/getServerSession";
import NavBar from "@components/shared/navBar/NavBar";
import SessionWatcher from "@components/shared/sessionWatcher/SessionWatcher";
import { redirect } from "next/navigation";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider
      initialUser={session.user}
      initialCsrfToken={session.csrfToken}
    >
      <SessionWatcher />
      <div className="min-h-screen w-full bg-surface-base">
        <div className="pfa-shell mx-auto w-full max-w-[2000px] px-4 pt-4 pb-16 sm:px-6 lg:px-8">
          <NavBar />
          <main>{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
