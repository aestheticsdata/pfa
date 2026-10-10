/** Hard caps, from the runner's environment only — nothing the control API can raise. */
export interface RunnerLimits {
  maxBots: number;
  maxRps: number;
  uploadBudgetBytes: number;
  uploadWindowDays: number;
}

export interface UploadEntry {
  at: number;
  bytes: number;
}

export interface UploadBudgetOptions {
  budgetBytes: number;
  windowMs: number;
  entries: UploadEntry[];
  /** Called with the ledger after every change, to persist it. */
  onChange?: (entries: UploadEntry[]) => void;
}

export interface UploadBudgetSnapshot {
  budgetBytes: number;
  usedBytes: number;
  remainingBytes: number;
  uploadsThisWeek: number;
  bytesThisWeek: number;
}

/** A clock in milliseconds, injectable so limits can be tested over a simulated year. */
export type Clock = () => number;
