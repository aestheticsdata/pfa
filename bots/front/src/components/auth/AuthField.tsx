import { cx } from "@lib/classNames/cx";

import type { AuthFieldProps } from "@components/auth/interfaces/authTypes";

/**
 * A terminal-style field: `-- LABEL` tight above an underline-only input. The label sits 2px over
 * its own input and 20px under the previous field, so an input never reads as the next label's.
 */
const AuthField = ({ label, name, error, hint, className, ...input }: AuthFieldProps) => (
  <div className="flex flex-col">
    <label
      htmlFor={name}
      className="mb-0.5 text-tiny font-medium uppercase tracking-label text-dim"
    >
      <span className="mr-1 text-ok">--</span>
      {label}
    </label>
    <input
      id={name}
      name={name}
      aria-invalid={error ? true : undefined}
      {...input}
      className={cx(
        "h-10 border-0 border-b border-underline bg-transparent px-0.5 font-mono text-base text-text focus:border-text focus:bg-okbg tablet:h-7.5 tablet:text-sm",
        error && "border-bad",
        className,
      )}
    />
    {error && <p className="m-0 mt-1.25 text-xs text-bad">{error}</p>}
    {!error && hint && <p className="m-0 mt-1.25 text-xs text-dim">{hint}</p>}
  </div>
);

export default AuthField;
