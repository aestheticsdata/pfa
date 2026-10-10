"use client";

import EyeIcon from "@components/ui/EyeIcon";
import { cx } from "@lib/classNames/cx";
import { AUTH_TEXT } from "@text/auth";
import { useState } from "react";

import type { AuthFieldProps } from "@components/auth/interfaces/authTypes";

/**
 * A terminal-style field: `-- LABEL` tight above an underline-only input. The label sits 2px over
 * its own input and 20px under the previous field, so an input never reads as the next label's.
 * A `secret` field is masked, with an eye at the end of the line to show or hide it.
 */
const AuthField = ({ label, name, error, hint, secret = false, className, type, ...input }: AuthFieldProps) => {
  const [revealed, setRevealed] = useState(false);
  const inputType = secret ? (revealed ? "text" : "password") : type;

  return (
    <div className="flex flex-col">
      <label
        htmlFor={name}
        className="mb-0.5 text-tiny font-medium uppercase tracking-label text-dim"
      >
        <span className="mr-1 text-ok">--</span>
        {label}
      </label>
      <div className="relative flex">
        <input
          id={name}
          name={name}
          type={inputType}
          aria-invalid={error ? true : undefined}
          {...input}
          className={cx(
            "h-10 w-full border-0 border-b border-underline bg-transparent px-0.5 font-mono text-base text-text focus:border-text focus:bg-okbg tablet:h-7.5 tablet:text-sm",
            secret && "pr-10 tablet:pr-8",
            error && "border-bad",
            className,
          )}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            aria-label={revealed ? AUTH_TEXT.reveal.hide(label) : AUTH_TEXT.reveal.show(label)}
            aria-pressed={revealed}
            aria-controls={name}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-dim hover:text-text focus-visible:text-text tablet:w-8"
          >
            <EyeIcon crossed={revealed} />
          </button>
        )}
      </div>
      {error && <p className="m-0 mt-1.25 text-xs text-bad">{error}</p>}
      {!error && hint && <p className="m-0 mt-1.25 text-xs text-dim">{hint}</p>}
    </div>
  );
};

export default AuthField;
