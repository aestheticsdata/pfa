export interface PaceComparison {
  /** Signed gap of the current daily rate vs the recent average, as a % (>0 = faster). */
  deltaPct: number;
  /** True when the current month is spending faster than the recent average. */
  faster: boolean;
}
