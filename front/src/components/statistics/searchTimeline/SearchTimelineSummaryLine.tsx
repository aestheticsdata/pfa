import { cadenceDays } from "@components/statistics/searchTimeline/helpers/searchTimelineLayout";
import { interpolate } from "@i18n/interpolate";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { format, parseISO } from "date-fns";
import { Fragment } from "react";

import type { TimelineWindow } from "@components/statistics/interfaces/searchTimelineTypes";
import type { SearchTimelineResponse } from "@src/schemas/stats";
import type { ReactNode } from "react";

interface FigureProps {
  children: ReactNode;
}

const Figure = ({ children }: FigureProps) => <span className="font-medium text-ink">{children}</span>;

interface SummaryFact {
  id: string;
  node: ReactNode;
}

interface SearchTimelineSummaryLineProps {
  /** hint → error → loading → no-occurrence; null once there is data to sum up. */
  statusMessage: string | null;
  /** The summary, only when the search has matches. */
  matches: SearchTimelineResponse["summary"] | null;
  window: TimelineWindow;
}

/**
 * One status line under the hero. Inline, so the frame never collapses and the
 * range switcher stays reachable (an empty 1 mois must not lock the user out of
 * the 3 ans view where the matches live). With data: cadence · average basket ·
 * last occurrence — three distinct facts, so each carries its figure highlighted
 * rather than dissolving into one flat run of muted text. Cadence is the window
 * span over the match count, a range-scoped figure like the hero numbers.
 */
const SearchTimelineSummaryLine = ({ statusMessage, matches, window }: SearchTimelineSummaryLineProps) => {
  const { euro } = useFormat();
  const dateLocale = useDateLocale();
  const { searchTimeline: t } = useTranslations("statistics");

  if (statusMessage !== null) return <p className="num mt-3.5 text-xs text-ink-3">{statusMessage}</p>;

  const everyDays = matches ? cadenceDays(window, matches.count) : 0;
  const facts: SummaryFact[] = matches
    ? [
        {
          id: "cadence",
          node:
            matches.count === 1
              ? t.frequencyOnce
              : everyDays <= 1
                ? t.frequencyDaily
                : interpolate(t.frequencyEvery, { days: <Figure>{everyDays}</Figure> }),
        },
        {
          id: "basket",
          node: interpolate(t.averageBasket, { amount: <Figure>{euro(matches.total / matches.count)} €</Figure> }),
        },
        ...(matches.lastDate
          ? [
              {
                id: "last",
                node: interpolate(t.lastOn, {
                  date: <Figure>{format(parseISO(matches.lastDate), "d MMM yyyy", { locale: dateLocale })}</Figure>,
                }),
              },
            ]
          : []),
      ]
    : [];

  return (
    <p className="num mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs text-ink-4">
      {facts.map((fact, i) => (
        <Fragment key={fact.id}>
          {i > 0 && <span className="text-ink-5">·</span>}
          <span>{fact.node}</span>
        </Fragment>
      ))}
    </p>
  );
};

export default SearchTimelineSummaryLine;
