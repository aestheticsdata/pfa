import { redirect } from "next/navigation";
import NavBar from "@components/shared/navBar/NavBar";
import { AuthProvider } from "@auth/context/AuthContext";
import { getServerSession } from "@auth/server/getServerSession";
import { Toaster } from "@components/ui/sonner";

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
      <div className="flex min-h-screen w-full flex-col items-stretch bg-background">
        <NavBar />
        <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
      <Toaster richColors closeButton position="bottom-right" />
    </AuthProvider>
  );
}
