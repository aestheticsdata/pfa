import { redirect } from "next/navigation";
import NavBar from "@components/shared/navBar/NavBar";
import { AuthProvider } from "@auth/context/AuthContext";
import { getServerSession } from "@auth/server/getServerSession";

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
      <div className="flex min-h-screen w-full flex-col items-center bg-grey1">
        <NavBar />
        <div className="w-full">{children}</div>
      </div>
    </AuthProvider>
  );
}
