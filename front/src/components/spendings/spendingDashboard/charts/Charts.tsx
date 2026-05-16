"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import useCharts from "@components/spendings/services/useCharts";
import SpendingsListModal from "@components/spendings/spendingsListModal/SpendingsListModal";
import {
  MONTHLY,
  WEEKLY,
} from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";

import type { ChartsCategory } from "@src/schemas/stats";

type periodType = typeof MONTHLY | typeof WEEKLY;

interface ChartsProps {
  periodType: periodType;
}

const getMaxValue = (data: ChartsCategory[]) =>
  Math.max(...data.map((category) => category.value));
const getTotal = (data: ChartsCategory[]) =>
  data.reduce((acc, curr) => acc + curr.value, 0);

const Charts = ({ periodType }: ChartsProps) => {
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [categoryInfos, setCategoryInfos] = useState<ChartsCategory>();
  const { data: charts, error } = useCharts(periodType);

  if (error) {
    throw error;
  }

  const maxv = charts && charts.length > 0 ? getMaxValue(charts) : 0;
  const total = charts && charts.length > 0 ? getTotal(charts) : 0;

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsInvoiceModalVisible(false);
      }
    };

    document.addEventListener("keyup", handleEscKey, false);
    return () => {
      document.removeEventListener("keyup", handleEscKey, false);
    };
  }, []);

  return (
    <>
      {isInvoiceModalVisible && (
        <SpendingsListModal
          handleClickOutside={() =>
            setIsInvoiceModalVisible(!isInvoiceModalVisible)
          }
          periodType={periodType}
          categoryInfos={categoryInfos!}
          total={categoryTotal}
        />
      )}
      <div className="charts-categories-list flex flex-col gap-2 w-full max-h-[324px] overflow-y-auto pr-1">
        {charts?.length === 0 && (
          <div className="flex justify-center items-center w-full h-32 text-gray-600">
            <BarChart3 className="w-16 h-16" />
          </div>
        )}
        {maxv !== 0 &&
          charts &&
          charts.map((category: ChartsCategory, index: number) => {
            const percent = (((category.value ?? 0) / total) * 100).toFixed(1);
            const color = category.categoryColor ?? "#94a3b8";
            return (
              <div
                key={`cat-${category.category ?? "uncategorized"}-${index}`}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => {
                  setIsInvoiceModalVisible(!isInvoiceModalVisible);
                  setCategoryTotal(category.value ?? 0);
                  setCategoryInfos(category);
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-gray-300 uppercase font-medium truncate transition-colors group-hover:text-gray-100">
                      {category.category ?? "sans catégorie"}
                    </span>
                    <span className="text-gray-400 ml-2 shrink-0 transition-colors group-hover:text-gray-200">
                      {percent}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800/60 rounded-full overflow-hidden transition-colors group-hover:bg-gray-700/80">
                    <div
                      className="h-full rounded-full transition-all group-hover:brightness-125 group-hover:saturate-150"
                      style={{
                        width: `${((category.value ?? 0) / maxv) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default Charts;
