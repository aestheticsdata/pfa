import type { EmptyNoticeProps } from "@components/panel/shared/interfaces/sharedTypes";

/** The info box of an app with no bots (`.infobox`). */
const EmptyNotice = ({ children }: EmptyNoticeProps) => (
  <div className="mt-4 rounded-ctl bg-infobg px-3 py-2.25 text-body text-text">{children}</div>
);

export default EmptyNotice;
