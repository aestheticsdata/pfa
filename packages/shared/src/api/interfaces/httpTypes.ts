import type { z } from "zod";
import type { HTTP_METHOD } from "#api/httpMethod";
import type { ContractDriftReporter } from "#schemas/interfaces/parseTypes";

export type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];

/** Query-string values; `null` and `undefined` are left out of the URL. */
export type QueryParams = Record<string, string | number | null | undefined>;

/** What a request resolves to: the parsed body and the status. */
export interface ApiResponse<Data = unknown> {
  data: Data;
  status: number;
}

/** A request as a caller describes it: a plain-object or FormData body, a query, extra headers. */
export interface RequestOptions {
  method?: HttpMethod;
  data?: unknown;
  query?: QueryParams;
  headers?: Record<string, string>;
}

/** A request about to leave, as the auth strategy sees it. */
export interface OutgoingRequest {
  method: HttpMethod;
  path: string;
}

/** A 401 or 403, handed to the auth strategy to decide whether one retry is worth it. */
export interface AuthFailure {
  status: number;
  request: OutgoingRequest;
  /** Sends a side request (GET, no recovery), e.g. to fetch a fresh CSRF token. */
  fetchRaw: (path: string) => Promise<ApiResponse>;
}

/**
 * How a client proves who it is. The web signs in with a cookie session guarded by a CSRF token;
 * the mobile app sends a Bearer token kept in the device's secure store. Everything else in the
 * client is the same.
 */
export interface AuthStrategy {
  credentials: RequestCredentials;
  /** Headers to add to this request (CSRF token, Authorization…). */
  authorize: (request: OutgoingRequest) => Promise<Record<string, string>>;
  /** Resolves true when the failed request should be sent once more. */
  recover: (failure: AuthFailure) => Promise<boolean>;
}

export interface ApiClientConfig {
  /** Origin + prefix the paths are appended to, e.g. "https://pfa.example.com/api". */
  baseUrl: string;
  auth: AuthStrategy;
  onDrift?: ContractDriftReporter;
  /** Injected in tests; the global `fetch` otherwise. */
  fetch?: typeof fetch;
}

/** A body sent with a write, and the schema its answer is parsed with. */
export interface WriteRequest<Schema extends z.ZodType> {
  method: HttpMethod;
  data?: unknown;
  schema: Schema;
}

export interface ApiClient {
  /** One request; rejects with `ApiError` on a non-2xx status, with fetch's TypeError offline. */
  request: (path: string, options?: RequestOptions) => Promise<ApiResponse>;
  /** GET + parse with `schema`, a drift reported through `onDrift`. */
  get: <Schema extends z.ZodType>(path: string, schema: Schema, query?: QueryParams) => Promise<z.output<Schema>>;
  /** A write whose answer is parsed with `write.schema`. */
  send: <Schema extends z.ZodType>(path: string, write: WriteRequest<Schema>) => Promise<z.output<Schema>>;
}
