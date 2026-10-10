import type { AuthSubmitProps } from "@components/auth/interfaces/authTypes";

/** `[ sign in ]`: the 1991computer gradient, no border, no shadow. */
const AuthSubmit = ({ children, disabled }: AuthSubmitProps) => (
  <button
    type="submit"
    disabled={disabled}
    className="mt-1 inline-flex h-10.5 w-full items-center justify-center border-0 bg-(image:--brand-gradient) text-sm font-semibold lowercase text-on-ok transition-[filter] duration-200 hover:brightness-106 hover:saturate-115 disabled:cursor-default disabled:opacity-40"
  >
    [ {children} ]
  </button>
);

export default AuthSubmit;
