import useWeeklyStatsHelper from "@components/spendings/helpers/useWeeklyStatsHelper";

/**
 * Number of `[data-sp-day]` cards the spendings page renders for the week
 * containing `date`. Weeks are calendar ranges truncated to the month, so the
 * first and last week of a month are shorter than 7 days — asserting a
 * hardcoded 7 makes the suite fail on those dates. Reuses the app's own range
 * helper so the tests can never drift from the product rule.
 */
export const daysInWeekOf = (date: Date): number => {
  const { makeRange, makeSlices } = useWeeklyStatsHelper();
  const dayOfMonth = date.getDate();
  const slice = makeSlices(makeRange(date)).find((week) => dayOfMonth >= week.start && dayOfMonth <= week.end);

  if (!slice) {
    throw new Error(`Aucune tranche de semaine ne contient le jour ${dayOfMonth}`);
  }

  return slice.end - slice.start + 1;
};
