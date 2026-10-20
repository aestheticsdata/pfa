export interface ExceptionalStats {
  total: number;
  count: number;
  biggest: { label: string; amount: number; date: Date } | null;
  average: number;
  spanMonths: number;
}
