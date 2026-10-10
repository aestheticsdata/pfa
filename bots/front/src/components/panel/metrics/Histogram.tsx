import type { HistogramProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** Live bots by pace (actions/min), count above each bar. */
const Histogram = ({ buckets }: HistogramProps) => {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return (
    <>
      <div className="flex h-27.5 items-end gap-1.5 border-b border-line">
        {buckets.map((bucket) => (
          <div
            key={bucket.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1 font-mono text-tiny text-muted"
          >
            <span>{bucket.count}</span>
            <i
              className="block min-h-0.5 w-full rounded-t-tag bg-ok/50"
              style={{ height: `${(bucket.count / max) * 85}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {buckets.map((bucket) => (
          <span
            key={bucket.label}
            className="flex-1 text-center font-mono text-micro text-dim"
          >
            {bucket.label}
          </span>
        ))}
      </div>
    </>
  );
};

export default Histogram;
