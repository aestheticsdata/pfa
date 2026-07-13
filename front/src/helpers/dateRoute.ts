import formatISO from "date-fns/formatISO";

export const DATE_QUERY_PARAM = "date";
// The Dépenses (weekly) page carries the selected week as a ?date= query param.
export const SPENDINGS_PATH = "/spendings";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const getTodayIsoDate = (): string => formatISO(new Date(), { representation: "date" });

export const isValidIsoDate = (value?: string): value is string => {
  if (!value || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

export const buildSpendingsPath = (date = getTodayIsoDate()): string => `${SPENDINGS_PATH}?${DATE_QUERY_PARAM}=${date}`;
