import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLongArrowAltDown,
  faLongArrowAltUp,
} from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import WidgetHeader from "@components/spendings/spendingDashboard/common/WidgetHeader";
import { WEEKLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";
import useWeeklyStats from "@components/spendings/services/useWeeklyStats";
import { accurateFixed } from "@helpers/mathExprEval";
import useDashboard from "@components/spendings/services/useDashboard";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useWeeklyStatsHelper from "@components/spendings/spendingDashboard/weeklyStats/helpers/useWeeklyStatsHelper";
import spendingsText from "@components/spendings/config/text";
import Spinner from "@components/common/Spinner";

import type { KeyboardEvent } from "react";

interface InitialCeiling {
  initialCeiling: string;
}

const WeeklyStats = () => {
  const { makeSlices, makeRange, isCurrentWeek} = useWeeklyStatsHelper();
  const { from } = useDatePickerWrapperStore();
  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const { get: { data: weeklyStats, error: weeklyStatsError }, mutation } = useWeeklyStats();
  const { get: { data: dashboard, error: dashboardError } } = useDashboard();
  const { register, handleSubmit, setFocus } = useForm<InitialCeiling>();
  const CEILING_WARN_LIMIT = 50;

  if (weeklyStatsError) {
    throw weeklyStatsError;
  }

  if (dashboardError) {
    throw dashboardError;
  }

  const initialCeiling = dashboard ? +dashboard.initialCeiling : 0;
  const weeklySlices = from ? makeSlices(makeRange(from)) : [];
  // filter(Boolean) removes 0 from array
  const zeroedOutWeeklyStats = weeklyStats?.filter(Boolean) ?? [];
  const averageWeeklyStatsAmount = zeroedOutWeeklyStats.length > 0
    ? accurateFixed(
      zeroedOutWeeklyStats.reduce((acc: number, curr: number) => acc + curr, 0)
      / zeroedOutWeeklyStats.length,
      1
    )
    : 0;

  const onSubmit = (value: InitialCeiling) => {
    setIsInputVisible(false);
    mutation.mutate(value.initialCeiling);
  }

  useEffect(() => {
    if (isInputVisible) {
      setFocus("initialCeiling", { shouldSelect: true });
    }
  }, [setFocus, isInputVisible]);

  return (
    <div className="flex flex-col shrink-0 items-center w-[320px] h-[265px] bg-black text-white rounded-sm gap-y-3 text-xs">
      <WidgetHeader
        title={spendingsText.dashboard.weeklyStats.headerTitle}
        periodType={WEEKLY}
      />
      <div className="flex uppercase select-none justify-start w-5/6 gap-x-1">
        <div className="text-xs">
          {spendingsText.dashboard.weeklyStats.weeklyCeiling} :
        </div>

        <div
          className={`${!isInputVisible ? "visible" : "hidden"}`}
          onClick={() => {dashboard?.initialAmount && setIsInputVisible(true)}}
        >
          <div className={`text-initialAmountWeekly font-bold px-1 ${dashboard?.initialAmount ? "hover:bg-initialAmountHover hover:text-spendingActionHover hover:cursor-pointer hover:rounded-sm" : "cursor-not-allowed"}`}>
            {initialCeiling ?? 0} €
          </div>
        </div>

        <div className={`${isInputVisible ? "visible" : "hidden"}`}>
          <form
            key={initialCeiling}
            onBlur={() => setIsInputVisible(false)}
            onSubmit={handleSubmit(onSubmit)}
          >
            <input
              className="w-10 px-1 outline-0 bg-transparent border-b border-b-white"
              onKeyDown={(e: KeyboardEvent) => {e.key === "Escape" && setIsInputVisible(false)}}
              defaultValue={initialCeiling}
              {...register("initialCeiling")}
            />
          </form>
        </div>

      </div>

      <div className="flex flex-col justify-center w-5/6 text-sm gap-y-1 h-1/2">
        {
          weeklyStats && weeklyStats.length > 0 && weeklySlices.length > 0 ?
            weeklyStats.map((weekSliceValue: number, i: number) => {
              const ceilingDiff = weekSliceValue - initialCeiling;
              return (
                <div
                  key={i}
                  className={`flex justify-between items-center ${from && isCurrentWeek(weeklySlices[i], from) && "font-bold bg-grey3 rounded-sm"}`}
                >
                  {from ? isCurrentWeek(weeklySlices[i], from) : false}
                  <div className="flex w-4/12 gap-x-2">
                    <div>{weeklySlices[i]}</div>
                    <div>:</div>
                  </div>
                  <div className="flex w-4/12 justify-start">
                    {Number(weekSliceValue).toFixed(2)} €
                  </div>
                  <div className="flex justify-start w-4/12 text-xxs gap-x-1">
                    <div>
                      {
                        ceilingDiff > 0 ?
                          <FontAwesomeIcon
                            icon={faLongArrowAltUp}
                            className={`${ceilingDiff > CEILING_WARN_LIMIT ? "text-ceilingExcess border-b-ceilingExcess" : "text-ceilingWarn border-b-ceilingWarn"} border-b`}
                          />
                          :
                          <FontAwesomeIcon
                            icon={faLongArrowAltDown}
                            className="text-ceilingOK border-t border-t-ceilingOK"
                          />
                      }
                    </div>
                    <div>
                      {
                        ceilingDiff > 0 ?
                          <div className={`${ceilingDiff > CEILING_WARN_LIMIT ? "text-ceilingExcess bg-generalWarningBackground px-1 rounded-sm": "text-ceilingWarn"}`}>
                            +
                            {Number(ceilingDiff).toFixed(2)} €
                          </div>
                          :
                          <div className="text-ceilingOK">
                            {Number(Math.abs(ceilingDiff)).toFixed(2)} €
                          </div>
                      }
                    </div>
                  </div>
                </div>
              )
            })
            :
            <Spinner />
        }
      </div>

      <div className="flex uppercase select-none justify-center w-full gap-x-1 text-xxs">
        <div>{spendingsText.dashboard.weeklyStats.weeklySpendings} : </div>
        <div className="font-bold">{Number(averageWeeklyStatsAmount || 0).toFixed(1)} €</div>
      </div>
    </div>
  );
}

export default WeeklyStats;
