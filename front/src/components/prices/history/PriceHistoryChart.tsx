"use client";

import formatMeasure from "@components/prices/helpers/formatMeasure";
import { dayToDate, historyPoints, nearestPoint, priceDomain } from "@components/prices/helpers/priceHistory";
import { LegendItem } from "@components/shared/LegendItem";
import { Tooltip } from "@components/ui/tooltip";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { useCursorHover, useElementWidth } from "@lib/dataviz";
import { linePath } from "@lib/dataviz/linePaths";
import { linearScale } from "@lib/dataviz/scales";
import { format, parseISO } from "date-fns";

import type { HistoryPoint } from "@components/prices/interfaces/pricesTypes";
import type { BasisComparison } from "@src/schemas/prices";
import type { MouseEvent } from "react";

interface PriceHistoryChartProps {
  comparison: BasisComparison;
  colors: Map<string, string>;
}

const HEIGHT = 180;
const PAD = { top: 12, right: 14, bottom: 26, left: 52 };
// A point answers the cursor within this many pixels.
const HOVER_REACH = 24;
const Y_TICKS = 3;

/**
 * Each store's unit price over time, on one basis (PFA-222): a line per store
 * bought from more than once, a dot per purchase, a tooltip with the purchase
 * as paid. Colours follow the store, never its rank; the ranking above doubles
 * as the table view.
 */
const PriceHistoryChart = ({ comparison, colors }: PriceHistoryChartProps) => {
  const t = useTranslations("prices");
  const { euro } = useFormat();
  const locale = useDateLocale();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const cursor = useCursorHover<HistoryPoint>();
  const unit = t.per[comparison.basis];

  const points = historyPoints(comparison, colors);
  const days = points.map((p) => p.day);
  const [yMin, yMax] = priceDomain(points.map((p) => p.unitPrice));
  const xMin = Math.min(...days);
  const xMax = Math.max(...days);
  const sx = linearScale(xMin, xMax === xMin ? xMin + 1 : xMax, PAD.left, Math.max(PAD.left + 1, width - PAD.right));
  const sy = linearScale(yMin, yMax, HEIGHT - PAD.bottom, PAD.top);
  const pixels = points.map((p) => ({ x: sx(p.day), y: sy(p.unitPrice) }));
  const stores = comparison.stores.filter((store) => colors.has(store.storeID));
  const hidden = comparison.stores.length - stores.length;
  const hovered = cursor.hover?.data ?? null;
  const hoveredMeasure = hovered ? formatMeasure(hovered, t.sizeUnits) : "";

  const onMove = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = nearestPoint(pixels, { x: event.clientX - box.left, y: event.clientY - box.top }, HOVER_REACH);
    if (index === null) cursor.clear();
    else cursor.show(event.clientX, event.clientY, points[index]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-2xs font-medium uppercase tracking-widest text-ink-4">{t.history.title}</span>
        <span className="text-2xs text-ink-4">{t.history.hint}</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
        {stores.map((store) => (
          <LegendItem
            key={store.storeID}
            swatch={
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ background: colors.get(store.storeID) }}
              />
            }
          >
            {store.name}
          </LegendItem>
        ))}
        {hidden > 0 && <span className="text-ink-4">{t.history.others(hidden)}</span>}
      </div>

      <div ref={ref}>
        {width > 0 && (
          <svg
            data-testid="price-history-chart"
            viewBox={`0 0 ${width} ${HEIGHT}`}
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={t.history.aria(t.basis[comparison.basis].toLowerCase())}
            className="block"
            onMouseMove={onMove}
            onMouseLeave={cursor.clear}
          >
            {Array.from({ length: Y_TICKS }, (_, i) => {
              const value = yMin + ((yMax - yMin) * i) / (Y_TICKS - 1);
              const y = sy(value);
              return (
                <g key={value}>
                  <line
                    x1={PAD.left}
                    x2={width - PAD.right}
                    y1={y}
                    y2={y}
                    stroke="var(--line-soft)"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="num fill-ink-4 text-2xs"
                  >
                    {euro(value)}
                  </text>
                </g>
              );
            })}

            {[xMin, xMax]
              .filter((day, i) => i === 0 || day !== xMin)
              .map((day, i) => (
                <text
                  key={day}
                  x={sx(day)}
                  y={HEIGHT - 6}
                  textAnchor={i === 0 ? "start" : "end"}
                  className="num fill-ink-4 text-2xs"
                >
                  {format(dayToDate(day), "d MMM yy", { locale })}
                </text>
              ))}

            {stores.map((store) => {
              const line = pixels.filter((_, i) => points[i].storeID === store.storeID);
              return line.length > 1 ? (
                <path
                  key={store.storeID}
                  d={linePath(line)}
                  fill="none"
                  stroke={colors.get(store.storeID)}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null;
            })}

            {hovered && (
              <line
                x1={sx(hovered.day)}
                x2={sx(hovered.day)}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                stroke="var(--ink-4)"
                strokeWidth={1}
                strokeDasharray="3 4"
              />
            )}

            {points.map((p, i) => {
              const isHovered = hovered?.storeID === p.storeID && hovered.date === p.date;
              return (
                <circle
                  // Two purchases from one store on one day share store and date; the list is derived, never reordered.
                  // biome-ignore lint/suspicious/noArrayIndexKey: points are a fixed positional list rebuilt from the data
                  key={`${p.storeID}-${p.date}-${i}`}
                  cx={pixels[i].x}
                  cy={pixels[i].y}
                  r={isHovered ? 5.5 : 4}
                  fill={p.color}
                  stroke="var(--surface-elev)"
                  strokeWidth={2}
                />
              );
            })}
          </svg>
        )}
      </div>

      <Tooltip
        mode="cursor"
        point={cursor.hover}
      >
        {hovered && (
          <>
            <div className="font-medium">{hovered.storeName}</div>
            <div className="text-ink-3">{format(parseISO(hovered.date), "d MMM yyyy", { locale })}</div>
            <div className="mt-0.5">
              {euro(hovered.unitPrice)} {unit}
            </div>
            <div className="text-ink-3">
              {euro(hovered.amount)} €{hoveredMeasure && ` · ${hoveredMeasure}`}
            </div>
          </>
        )}
      </Tooltip>
    </div>
  );
};

export default PriceHistoryChart;
