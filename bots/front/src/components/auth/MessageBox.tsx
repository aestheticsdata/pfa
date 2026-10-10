import { MESSAGE_KIND } from "@components/auth/messageKind";
import { cx } from "@lib/classNames/cx";
import { AUTH_TEXT } from "@text/auth";

import type { MessageBoxProps } from "@components/auth/interfaces/authTypes";

const KINDS = {
  [MESSAGE_KIND.error]: "bg-badbg text-badtx",
  [MESSAGE_KIND.info]: "bg-infobg text-text",
  [MESSAGE_KIND.warn]: "bg-warnbg text-warn",
  [MESSAGE_KIND.ok]: "bg-okbg text-ok",
};

/** The boxed message (`.errbox`, `.warnbox`…): a 2px left rule in the text colour. */
const MessageBox = ({ kind, children }: MessageBoxProps) => (
  <div
    role={kind === MESSAGE_KIND.error ? "alert" : "status"}
    className={cx("rounded-ctl border-l-2 border-current px-3 py-2.25 text-body", KINDS[kind])}
  >
    {kind === MESSAGE_KIND.error && <b className="font-semibold">{AUTH_TEXT.errPrefix} </b>}
    {children}
  </div>
);

export default MessageBox;
