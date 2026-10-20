interface WhiskerProps {
  lowFrac: number;
  highFrac: number;
}

/** Typical-range whisker (p10→p90): a thin connector with end caps, over the main bar. */
const Whisker = ({ lowFrac, highFrac }: WhiskerProps) => (
  <div
    className="pointer-events-none absolute inset-0"
    aria-hidden
  >
    <span
      className="absolute top-1/2 h-px -translate-y-1/2 bg-ink-2/45"
      style={{ left: `${lowFrac * 100}%`, width: `${Math.max(0, highFrac - lowFrac) * 100}%` }}
    />
    <span
      className="absolute inset-y-1 w-px bg-ink-2/80"
      style={{ left: `${lowFrac * 100}%` }}
    />
    <span
      className="absolute inset-y-1 w-px bg-ink-2/80"
      style={{ left: `${highFrac * 100}%` }}
    />
  </div>
);

export default Whisker;
