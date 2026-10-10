import RunnerBrand from "@components/brand/RunnerBrand";

import type { AuthCardProps } from "@components/auth/interfaces/authTypes";

/** The auth card: white, hairline, soft shadow, 380px, mark + wordmark on top. */
const AuthCard = ({ children, testId }: AuthCardProps) => (
  <div
    data-testid={testId}
    className="relative z-1 flex w-full max-w-auth flex-col gap-1.5 border border-line bg-panel px-5 py-6 text-left shadow-auth tablet:px-7 tablet:py-7.5"
  >
    <RunnerBrand size={30} />
    {children}
  </div>
);

export default AuthCard;
