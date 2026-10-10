import type { HTTP_METHOD } from "@core/constants/http";

export type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];

export interface HttpRequest {
  method: HttpMethod;
  path: string;
  json?: unknown;
  form?: FormData;
}

export interface HttpResponse<T = unknown> {
  status: number;
  body: T;
}

/** What every request reports, for the runner's live counters. */
export interface RequestRecord {
  method: HttpMethod;
  path: string;
  status: number;
  ms: number;
}

export interface AppClientOptions {
  baseUrl: string;
  /** Waited on before every request: the global RPS cap. */
  throttle: () => Promise<void>;
  onRequest?: (record: RequestRecord) => void;
}
