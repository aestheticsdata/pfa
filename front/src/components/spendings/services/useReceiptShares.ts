import { buildDayEntries, groupEntriesByReceipt } from "@components/spendings/helpers/dayEntries";
import useSpendings from "@components/spendings/services/useSpendings";

/**
 * Who shares each receipt file in the loaded month (PFA-189): a shared receipt
 * is several rows — a group counting once — pointing at one file. Read from the
 * month's spendings already in cache, so rows of other days count too.
 */
const useReceiptShares = () => {
  const { spendingsByMonth } = useSpendings();
  const byFile = groupEntriesByReceipt(buildDayEntries(spendingsByMonth ?? []));
  return (invoicefile: string | null) => (invoicefile ? (byFile.get(invoicefile) ?? []) : []);
};

export default useReceiptShares;
