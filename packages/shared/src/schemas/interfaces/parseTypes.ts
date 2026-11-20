/** One issue of a contract drift, safe to send anywhere: no value from the payload. */
export interface ContractDriftIssue {
  path: string;
  code: string;
  message: string;
}

/** What a drift reporter receives (PFA-177): the shape Iknos already ingests from the web. */
export interface ContractDriftReport {
  message: string;
  api_contract: {
    endpoint: string;
    issues: ContractDriftIssue[];
    issue_count: number;
  };
}

export type ContractDriftReporter = (report: ContractDriftReport) => void;

/** Where a response came from, and who hears about it when it no longer matches its schema. */
export interface ParseContext {
  endpoint: string;
  onDrift?: ContractDriftReporter;
}
