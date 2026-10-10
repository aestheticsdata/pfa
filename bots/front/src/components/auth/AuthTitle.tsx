import { MESSAGE_KIND } from "@components/auth/messageKind";
import { cx } from "@lib/classNames/cx";
import { AUTH_TEXT } from "@text/auth";

import type { AuthTitleProps } from "@components/auth/interfaces/authTypes";

/**
 * `$ sign in ▌` and, on the same 28px row, the error or notice: rendered always (a space when
 * empty) so the title never moves and the card never grows.
 */
const AuthTitle = ({ title, message, kind = MESSAGE_KIND.error }: AuthTitleProps) => (
  <div className="mt-3 flex h-7 items-baseline gap-1.5 overflow-hidden">
    <h1 className="m-0 shrink-0 whitespace-nowrap font-mono text-base leading-7 font-semibold lowercase">
      <span className="text-ok">$ </span>
      {title}
      <span
        aria-hidden="true"
        className="ml-1 animate-blink text-ok"
      >
        ▌
      </span>
    </h1>
    <p
      role={kind === MESSAGE_KIND.error ? "alert" : "status"}
      aria-live="polite"
      className={cx(
        "m-0 min-w-0 flex-1 truncate font-mono text-micro leading-none font-medium",
        kind === MESSAGE_KIND.error ? "text-bad" : "text-dim",
      )}
    >
      {message ? (
        <>
          {kind === MESSAGE_KIND.error && <b className="mr-1.5 font-bold">{AUTH_TEXT.errPrefix}</b>}
          {message}
        </>
      ) : (
        " "
      )}
    </p>
  </div>
);

export default AuthTitle;
