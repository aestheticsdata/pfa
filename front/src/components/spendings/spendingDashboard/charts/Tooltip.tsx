"use client";

import adjustFontColor from "@components/shared/helpers/adjustColor";

import type { ChartsCategory } from "@src/schemas/stats";

interface TooltipProps {
  tooltipPos: { x: number; y: number };
  categoryInfos: ChartsCategory;
}

const Tooltip = ({ tooltipPos, categoryInfos }: TooltipProps) => {
  const color = categoryInfos?.categoryColor ?? "#94a3b8";
  return (
    <div
      className="fixed flex flex-col w-[120px] rounded-lg border border-gray-800/50 bg-popover text-popover-foreground shadow-2xl text-xs overflow-hidden z-[80] pointer-events-none"
      style={{
        left: tooltipPos.x + 16 + "px",
        top: tooltipPos.y - 50 + "px",
      }}
    >
      <div className="flex justify-center items-center px-2 py-1.5 text-gray-100">
        {categoryInfos && (
          <span>{Number(categoryInfos.value).toFixed(2)} €</span>
        )}
      </div>
      {categoryInfos && (
        <div
          className="flex justify-center items-center uppercase text-[10px] font-bold py-1"
          style={{
            backgroundColor: color,
            color: adjustFontColor(color) === "#ffffff" ? "#ffffff" : "#000000",
          }}
        >
          {categoryInfos?.category ?? "sans catégories"}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
