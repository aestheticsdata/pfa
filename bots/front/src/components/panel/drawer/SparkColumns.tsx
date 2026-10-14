"use client";

import usePlotHover from "@components/hooks/usePlotHover";
import CursorTooltip from "@components/ui/CursorTooltip";
import TooltipBody from "@components/ui/TooltipBody";
import StackedColumns from "@lib/dataviz/StackedColumns";
import { count } from "@lib/format/format";
import { CHART_COLOR } from "@lib/panel/chartColors";
import { CHART_TEXT } from "@text/charts";

import type { SparkColumnsProps } from "@components/panel/drawer/interfaces/drawerTypes";

/** A bot's actions per slice, its errors on top, each slice with its tooltip (PFA-229). */
const SparkColumns = ({ spark, ariaLabel, when }: SparkColumnsProps) => {
  const { hover, index, onHover } = usePlotHover();
  const hovered = index === null ? undefined : spark[index];
  return (
    <>
      <StackedColumns
        className="h-17.5 gap-0.75"
        ariaLabel={ariaLabel}
        onHover={onHover}
        active={index}
        columns={spark.map((slice, at) => ({
          key: String(at),
          parts: [
            { label: CHART_TEXT.errors, value: slice.errors, color: CHART_COLOR.errors },
            { label: CHART_TEXT.actions, value: slice.actions, color: CHART_COLOR.actions },
          ],
        }))}
        max={Math.max(0.1, ...spark.map((slice) => slice.actions + slice.errors))}
      />
      <CursorTooltip point={hover}>
        {hovered && index !== null && (
          <TooltipBody
            title={ariaLabel}
            sub={when(index)}
            rows={[
              { label: CHART_TEXT.actions, value: count(hovered.actions), color: CHART_COLOR.actions },
              {
                label: CHART_TEXT.errors,
                value: count(hovered.errors),
                color: CHART_COLOR.errors,
                bad: hovered.errors > 0,
              },
            ]}
          />
        )}
      </CursorTooltip>
    </>
  );
};

export default SparkColumns;
