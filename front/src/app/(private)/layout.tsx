import { redirect } from "next/navigation";
import NavBar from "@components/shared/navBar/NavBar";
import { AuthProvider } from "@auth/context/AuthContext";
import { getServerSession } from "@auth/server/getServerSession";
import { Toaster } from "@components/ui/sonner";
import SessionWatcher from "@components/shared/sessionWatcher/SessionWatcher";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={session.user} initialCsrfToken={session.csrfToken}>
      <SessionWatcher />
      <div className="min-h-screen w-full bg-background">
        <div className="mx-auto w-full max-w-[2000px] px-4 pt-4 pb-16 sm:px-6 lg:px-8">
          <NavBar />
          <main>{children}</main>
        </div>
      </div>
      <Toaster richColors closeButton position="bottom-right" />
    </AuthProvider>
  );
}
