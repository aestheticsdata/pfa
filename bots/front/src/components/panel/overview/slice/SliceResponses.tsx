import LegendItem from "@components/panel/metrics/LegendItem";
import SliceSection from "@components/panel/overview/slice/SliceSection";
import StackedBar from "@lib/dataviz/StackedBar";
import { count } from "@lib/format/format";
import { OVERVIEW_TEXT } from "@text/overview";

import type { SlicePartProps } from "@components/panel/overview/interfaces/overviewTypes";

/** How the app answered the slice's requests: 2xx / 4xx / 5xx in one bar, with the counts. */
const SliceResponses = ({ point }: SlicePartProps) => {
  const text = OVERVIEW_TEXT.slice;
  const codes = [
    { label: "2xx", value: point.codes2xx, color: "color-mix(in oklch, var(--ok) 50%, transparent)" },
    { label: "4xx", value: point.codes4xx, color: "var(--warn)" },
    { label: "5xx", value: point.codes5xx, color: "var(--bad)" },
  ];
  return (
    <SliceSection
      title={text.responses}
      aside={text.requestsCount(point.requests)}
    >
      {point.requests === 0 ? (
        <p className="m-0 text-xs text-dim">{text.noRequests}</p>
      ) : (
        <>
          <StackedBar
            className="h-2.5"
            segments={codes}
            ariaLabel={text.responses}
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-dim">
            {codes.map((code) => (
              <LegendItem
                key={code.label}
                color={code.color}
                label={code.label}
                value={count(code.value)}
              />
            ))}
          </div>
        </>
      )}
    </SliceSection>
  );
};

export default SliceResponses;
