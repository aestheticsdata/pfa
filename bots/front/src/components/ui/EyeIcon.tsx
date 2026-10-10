import type { EyeIconProps } from "@components/ui/interfaces/uiTypes";

/** An eye, struck through when `crossed`: the reveal toggle of a secret field. Inherits its colour. */
const EyeIcon = ({ crossed }: EyeIconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle
      cx="12"
      cy="12"
      r="3"
    />
    {crossed && <path d="M3 3l18 18" />}
  </svg>
);

export default EyeIcon;
