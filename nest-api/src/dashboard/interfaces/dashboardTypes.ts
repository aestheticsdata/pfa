/** A month's dashboard as GET /dashboard returns it (PFA-257); amounts as numbers. */
export interface DashboardItem {
  ID: string;
  dateFrom: Date;
  dateTo: Date;
  initialAmount: number;
  initialCeiling: number | null;
}
