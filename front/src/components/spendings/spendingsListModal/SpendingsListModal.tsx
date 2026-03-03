"use client";

import {
  useEffect,
  useRef, useState
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import useOnClickOutside from "use-onclickoutside";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDay, faChartSimple, faCircle } from "@fortawesome/free-solid-svg-icons";
import parseISO from "date-fns/parseISO";
import formatISO from "date-fns/formatISO";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import Period from "@components/spendings/spendingDashboard/common/Period";
import CategoryComponent from "@components/common/Category";
import useSpendings from "@components/spendings/services/useSpendings";
import { MONTHLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";
import texts from "@components/spendings/config/text";
import { DASHBOARD_PATH, DATE_QUERY_PARAM } from "@helpers/dateRoute";

import type { CategoryProps } from "@src/interfaces/category";
import type { SpendingItem } from "@components/spendings/types";

interface SpendingsListModalProps {
  handleClickOutside: () => void;
  periodType: string;
  categoryInfos: CategoryProps;
  total: number;
}

const SpendingsListModal = ({ handleClickOutside, periodType, categoryInfos, total }: SpendingsListModalProps) => {
  const { spendingsByWeek, spendingsByMonth } = useSpendings();
  const ref = useRef<HTMLDivElement>(null);
  const [searchTerm, setsearchTerm] = useState("");
  const { spendingsListModal: spendingsListModalTexts } = texts;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const normalizePath = (path: string): string => {
    const normalized = path.replace(/\/+$/, "");
    return normalized === "" ? "/" : normalized;
  };

  useOnClickOutside(ref as React.RefObject<HTMLElement>, handleClickOutside);

  useEffect(() => {
    // prevent scrolling on body when modal is open
    document.body.style.overflowY = 'hidden';
    return () => {
      document.body.style.overflowY = 'auto';
    }
  }, []);

  const groupByDate = (spendings: SpendingItem[]): Record<string, SpendingItem[]> => {
    return spendings?.reduce((acc: Record<string, SpendingItem[]>, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = []
      }
      acc[curr.date].push(curr);
      return acc;
    }, {})
  }

  const displaySpendingsList = () => {
    const getAllPreviousEntries = (currentIndex: number): SpendingItem[] => {
      const normalizedSearchTerm = searchTerm.toLowerCase();

      if (periodType === MONTHLY && spendingsByMonth) {
        const filteredSpendings = spendingsByMonth.filter((spending) =>
          spending.category === categoryInfos.category &&
          spending.label.toLowerCase().includes(normalizedSearchTerm)
        );
        const grouped = groupByDate(filteredSpendings);
        const entries = Object.entries(grouped);
        return entries
          .slice(0, currentIndex + 1)
          .reduce((acc: SpendingItem[], [_, daySpendings]) => [...acc, ...daySpendings as SpendingItem[]], []);
      } else if (spendingsByWeek) {
        const flattenedSpendings = spendingsByWeek
          .filter((spendingGroup) => spendingGroup.items.length > 0)
          .flatMap((spendingGroup) => spendingGroup.items)
          .filter(spending =>
            spending.category === categoryInfos.category &&
            spending.label.toLowerCase().includes(normalizedSearchTerm)
          );
        const grouped = groupByDate(flattenedSpendings);
        const entries = Object.entries(grouped);
        return entries
          .slice(0, currentIndex + 1)
          .reduce((acc: SpendingItem[], [_, daySpendings]) => [...acc, ...daySpendings as SpendingItem[]], []);
      }
      return [];
    };

    const calculateDayTotal = (daySpendings: SpendingItem[]): number => {
      return daySpendings.reduce((acc, spending) => acc + Number(spending.amount), 0);
    };

    const spendingsList = (spendings: [string, SpendingItem[]], i: number) => {
      const dayTotal = calculateDayTotal(spendings[1]);
      const cumulativeTotal = getAllPreviousEntries(i)
        .reduce((acc, spending) => acc + Number(spending.amount), 0);

      return (
        <div
          key={i}
          className="rounded-sm border-2 border-grey1 pb-1 m-4 text-sm bg-gray-100"
        >
          {periodType === MONTHLY ? (
            <div
              className="cursor-pointer"
              onClick={() => {
                const dateISO = formatISO(new Date(spendings[0]), { representation: "date" });
                if (normalizePath(pathname) === DASHBOARD_PATH) {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set(DATE_QUERY_PARAM, dateISO);
                  router.push(`${DASHBOARD_PATH}?${params.toString()}`);
                } else {
                  router.push(`${DASHBOARD_PATH}?${DATE_QUERY_PARAM}=${dateISO}`);
                }
                handleClickOutside();
              }}
            >
              <div className="flex justify-between font-medium bg-grey01 p-2 mb-1 text-grey3 hover:bg-grey1 transition-colors ease-linear duration-200">
                <div className="uppercase">
                  {format(parseISO(spendings[0]), "EEEE dd MMMM", { locale: fr })}
                </div>
                <div className="flex text-xxs space-x-6">

                  <div className="flex flex-col items-end">

                    <div className="flex items-center space-x-1">
                      <div>{spendingsListModalTexts.dayTotal}</div>
                      <FontAwesomeIcon icon={faCalendarDay}/>
                    </div>

                    <div className="flex items-start h-full text-sm">{dayTotal.toFixed(1)} €</div>
                  </div>

                  <div className="flex flex-col items-end pb-1 px-2">
                    <div className="flex items-center space-x-1">
                      <div>{spendingsListModalTexts.cumulativeTotal}</div>
                      <FontAwesomeIcon icon={faChartSimple}/>
                    </div>
                    <div className="flex w-full justify-end pr-1 rounded-sm p-0.5 bg-gray-500 text-white">
                      {cumulativeTotal.toFixed(1)} €
                    </div>
                    <div className="text-slate-700">{spendingsListModalTexts.monthPercentage} {((cumulativeTotal / total) * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="uppercase font-medium bg-grey01 p-1 mb-1 text-grey3">
              {format(parseISO(spendings[0]), "EEEE dd MMMM", {locale: fr})}
            </div>
          )}

          <div className="flex flex-col space-y-2 py-2">
            {spendings[1].map((spending: SpendingItem, j: number) => (
              <div
                className="flex items-center space-x-2 text-sm px-2"
                key={i + j}
              >
                
                <div className="flex justify-between text-slate-700 w-full">
                  <div className="flex items-center space-x-2">
                    <div className="bg-slate-400 w-1.5 h-1.5 rounded-full shrink-0" />
                    <span className="text-slate-700">{spending.label}</span>
                  </div>
                
                  <div>{Number(spending.amount).toFixed(2)} €</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    if (periodType === MONTHLY) {
      const normalizedSearchTerm = searchTerm.toLowerCase();

      return spendingsByMonth &&
        Object.entries(
          groupByDate(
            spendingsByMonth
              .filter((spending) => {
                return (spending.category === categoryInfos.category) &&
                  spending.label.toLowerCase().includes(normalizedSearchTerm);
              })))
          .map((spendings, i) => {
            return spendingsList(spendings, i)
          })
      }
    else {
      const normalizedSearchTerm = searchTerm.toLowerCase();

      return spendingsByWeek &&
        Object.entries(
          groupByDate(
            spendingsByWeek
              .filter((spendingGroup) => spendingGroup.items.length > 0)
              .flatMap((spendingGroup) => spendingGroup.items)
              ?.filter((spending) => {
                return (spending.category === categoryInfos.category) &&
                  spending.label.toLowerCase().includes(normalizedSearchTerm);
              })))
          .map((spendings, i) => spendingsList(spendings, i))
    }
  }

  return (
    <div className="fixed flex justify-center items-center z-50 left-0 right-0 top-0 bottom-0 bg-invoiceFileModalBackground">
      <div ref={ref} className="absolute flex flex-col w-[700px] h-[520px] bg-grey0 rounded-sm">

        <div className="flex flex-row items-center px-4 border-b border-b-grey3 h-[50px] pb-2">
          
          <div className="flex flex-row items-center space-x-6 flex-1 min-w-0">
            <div className="shrink-0 whitespace-nowrap">
              {categoryInfos?.category ?
                <CategoryComponent item={categoryInfos} customCss="px-6" />
                :
                spendingsListModalTexts.noCategoryLabel}
            </div>
            <Period periodType={periodType} />
            
          </div>
          
          <div className="flex flex-row space-x-2 uppercase text-sm shrink-0">
            <div>{spendingsListModalTexts.total} :</div>
            <div className="font-bold">{total} €</div>
          </div>
        
        </div>

        <div className="flex flex-row space-x-2 border-b border-b-grey3 px-2 py-2 items-center">
          <div className="shrink-0">{spendingsListModalTexts.filter} :</div>
          <input
            className="bg-white focus:shadow-login border-gray-400 border outline-hidden h-8 rounded-sm p-1 text-sm flex-1 min-w-0"
            value={searchTerm}
            onChange={e => setsearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col overflow-y-auto h-[420px] pt-2">
          {displaySpendingsList()}
        </div>

      </div>
    </div>
  );
}

export default SpendingsListModal;
