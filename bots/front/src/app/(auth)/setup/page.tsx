import AuthCard from "@components/auth/AuthCard";
import SealedNotice from "@components/auth/SealedNotice";
import SetupForm from "@components/auth/SetupForm";
import { readAuthState } from "@lib/auth/authState";

/** First run; once the account exists, the sealed state — and nothing to submit. */
const SetupPage = async () => {
  const state = await readAuthState();
  return <AuthCard testId="setup">{state.accountExists ? <SealedNotice /> : <SetupForm />}</AuthCard>;
};

export default SetupPage;
