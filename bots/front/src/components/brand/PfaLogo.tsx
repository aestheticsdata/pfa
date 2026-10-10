import type { MarkProps } from "@components/brand/interfaces/brandTypes";

/** PFA's pulse mark (handoff `Logo`): its own colours, whatever the theme around it. */
const PfaLogo = ({ size }: MarkProps) => {
  const gradient = `pfa-logo-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-label="pfa"
      role="img"
      className="block shrink-0"
    >
      <defs>
        <linearGradient
          id={gradient}
          x1="0"
          y1="1"
          x2="1"
          y2="0"
        >
          <stop
            offset="0"
            stopColor="oklch(0.80 0.13 210)"
          />
          <stop
            offset="1"
            stopColor="oklch(0.85 0.15 150)"
          />
        </linearGradient>
      </defs>
      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="13"
        fill="oklch(0.16 0.01 245)"
        stroke={`url(#${gradient})`}
        strokeWidth="2"
      />
      <path
        d="M10 28.5h6.5l4.5-11 5.5 15 4-9H38"
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PfaLogo;
