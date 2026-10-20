export interface DatePickerWrapperStoreProps {
  from: Date | null;
  to: Date | null;
  range: Date[] | null;
  selectedDateIso: string | null;
  // Cross-tree "scroll the Spendings timeline to this day" request (COS-38). Set
  // by the NavBar "Today" button and by a fresh spending creation; read
  // and consumed (reset to null) by SpendingView once the matching card mounts.
  scrollToDayIso: string | null;
  // The spending picked from the search modal (PFA-188): its row is brought into
  // view inside its day card and spotlighted, then the row clears it once the
  // animation ends.
  spotlightSpendingId: string | null;
  setWeek: (date: Date) => void;
  setFrom: (from: Date) => void;
  setTo: (from: Date) => void;
  setRange: (from: Date[]) => void;
  setScrollToDayIso: (dateIso: string | null) => void;
  setSpotlightSpendingId: (spendingId: string | null) => void;
}
