import AuthTitle from "@components/auth/AuthTitle";
import { AUTH_TEXT } from "@text/auth";
import Link from "next/link";

/** `/setup` once the account exists: nothing can be created any more. */
const SealedNotice = () => (
  <>
    <AuthTitle title={AUTH_TEXT.sealed.title} />
    <p className="m-0 text-body text-muted">{AUTH_TEXT.sealed.lead}</p>
    <Link
      href="/signin"
      className="mt-4 inline-flex h-10.5 w-full items-center justify-center bg-(image:--brand-gradient) text-sm font-semibold lowercase text-on-ok no-underline transition-[filter] duration-200 hover:brightness-106 hover:saturate-115"
    >
      [ {AUTH_TEXT.sealed.submit} ]
    </Link>
  </>
);

export default SealedNotice;
