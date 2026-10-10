import { cx } from "@lib/classNames/cx";

import type { FieldBlockProps } from "@components/panel/banner/interfaces/bannerTypes";

/**
 * One column of an incident row: label, mono value, optional sub-line. Times are rendered on the
 * browser's clock, so the server's (UTC) first paint may differ by the zone: not a mismatch.
 */
const FieldBlock = ({ label, value, title, sub, big = false }: FieldBlockProps) => (
  <div className="min-w-0">
    <p className="m-0 mb-0.5 text-tiny font-medium uppercase tracking-label text-badtx">{label}</p>
    <p
      className={cx("m-0 truncate font-mono", big && "text-lg font-semibold")}
      title={title}
      suppressHydrationWarning
    >
      {value}
    </p>
    {sub && (
      <p
        className="m-0 truncate font-mono text-mini text-badtx"
        title={sub}
        suppressHydrationWarning
      >
        {sub}
      </p>
    )}
  </div>
);

export default FieldBlock;
