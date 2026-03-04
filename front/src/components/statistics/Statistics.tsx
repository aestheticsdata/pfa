"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import useCategories from "@components/spendings/services/useCategories";
import { selectOptionsCSS } from "@components/common/form/selectOptionCSS";
import mapStatisticsCategories from "@components/statistics/helpers/mapStatisticsCategories";
import useStatistics from "@components/statistics/services/useStatistics";
import PFABarCharts from "@components/statistics/PFABarCharts";
import PFALineCharts from "@components/statistics/PFALineCharts";
import PFAResponsiveChartsContainer from "@components/statistics/PFAResponsiveChartsContainer";
import type { StatisticsCategoryOption } from "@components/statistics/helpers/mapStatisticsCategories";

interface YearOption {
  value: number;
  label: number;
}

interface StatisticsFormValues {
  categorySelector: StatisticsCategoryOption[];
  yearSelector: YearOption;
}

const firstYearAvailable = 2018;

const Statistics = () => {
  const { categories, error: categoriesError } = useCategories();
  const categoriesMarshalled = mapStatisticsCategories(categories);
  const [initialCategories, setInitialCategories] = useState<StatisticsCategoryOption[]>([]);

  const currentYear = new Date().getFullYear();
  const makeYearsOptions = () => {
    const years = Array.from({ length: currentYear - firstYearAvailable + 1 }, (_, i) => currentYear - i);
    return years.map(year => ({ value: year, label: year }));
  };

  const defaultYear: YearOption = { value: currentYear, label: currentYear };
  const [initialYear, setInitialYear] = useState<YearOption>(defaultYear);

  const { control } = useForm<StatisticsFormValues>({
    mode: "onChange",
    defaultValues: {
      categorySelector: [],
      yearSelector: defaultYear,
    }
  });

  const { isLoading: isStatisticsLoading, statistics, error } = useStatistics(initialCategories, initialYear);

  if (categoriesError) {
    throw categoriesError;
  }

  if (error) {
    throw error;
  }

  return (
    <>
      <div className="flex flex-col gap-y-8 mt-20 p-2 w-full">
        <div className="flex flex-col space-y-2 w-full">
          <Controller
            name="yearSelector"
            control={control}
            render={({field}) =>
              <Select
                placeholder="Select Year"
                isMulti={false}
                styles={selectOptionsCSS("500px")}
                options={makeYearsOptions()}
                value={initialYear}
                onChange={(selectedYear) => {
                  if (selectedYear) {
                    setInitialYear(selectedYear);
                    field.onChange(selectedYear);
                  }
                }}
              />
            }
          />

          <div>
            {categoriesMarshalled &&
              <div>
                <Controller
                  name="categorySelector"
                  control={control}
                  render={({field}) =>
                    <Select
                      placeholder="Catégories"
                      isMulti={true}
                      styles={selectOptionsCSS("500px")}
                      options={categoriesMarshalled}
                      value={initialCategories}
                      onChange={(selectedOptions) => {
                        const options = (selectedOptions ? Array.from(selectedOptions) : []) as StatisticsCategoryOption[];
                        setInitialCategories(options);
                        field.onChange(options);
                      }}
                    />
                  }
                />
              </div>
            }
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <PFAResponsiveChartsContainer>
            <PFABarCharts data={statistics ?? null} year={initialYear.value} />
          </PFAResponsiveChartsContainer>

          <PFAResponsiveChartsContainer>
            <PFALineCharts data={statistics ?? null} year={initialYear.value} />
          </PFAResponsiveChartsContainer>
        </div>

      </div>

      {isStatisticsLoading &&
        <div className="flex absolute items-center justify-center z-10 inset-0 bg-green-50 opacity-70">
          Loading statistics...
        </div>
      }
    </>
  );
}

export default Statistics;
