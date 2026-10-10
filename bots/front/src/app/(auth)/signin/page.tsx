import AuthCard from "@components/auth/AuthCard";
import SignInForm from "@components/auth/SignInForm";
import { readAuthState } from "@lib/auth/authState";
import { AUTH_TEXT } from "@text/auth";
import { redirect } from "next/navigation";

const SignInPage = async ({ searchParams }: PageProps<"/signin">) => {
  const [state, query] = await Promise.all([readAuthState(), searchParams]);
  if (!state.accountExists) redirect("/setup");
  const next = typeof query.next === "string" ? query.next : "/";
  if (state.signedIn) redirect(next);
  const notice = query.expired ? AUTH_TEXT.signIn.expired : query.reset ? AUTH_TEXT.signIn.reset : null;
  return (
    <AuthCard testId="signin">
      <SignInForm
        notice={notice}
        next={next}
      />
    </AuthCard>
  );
};

export default SignInPage;
