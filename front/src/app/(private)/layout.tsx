import { AuthProvider } from "@auth/context/AuthContext";
import { getServerSession } from "@auth/server/getServerSession";
import NavBar from "@components/shared/navBar/NavBar";
import SessionWatcher from "@components/shared/sessionWatcher/SessionWatcher";
import LocaleUserSync from "@i18n/LocaleUserSync";
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
      <LocaleUserSync />
      <div className="min-h-screen w-full bg-surface-base">
        <div className="pfa-shell mx-auto w-full max-w-[2000px] px-4 pt-4 pb-16 sm:px-6 lg:px-8">
          <NavBar />
          <main>{children}</main>
          {/* Dims + blurs the page while a navbar overlay is open (COS-161).
              Driven entirely from CSS (`:has([data-nav-overlay])`), so it stays
              a static node here with no state to wire. */}
          <div
            className="pfa-nav-scrim"
            aria-hidden
          />
        </div>
      </div>
    </AuthProvider>
  );
}
