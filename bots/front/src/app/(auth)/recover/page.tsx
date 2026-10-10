import AuthCard from "@components/auth/AuthCard";
import RecoverForm from "@components/auth/RecoverForm";

/** Reachable by typing the URL only: nothing in the UI links here. */
const RecoverPage = () => (
  <AuthCard testId="recover">
    <RecoverForm />
  </AuthCard>
);

export default RecoverPage;
