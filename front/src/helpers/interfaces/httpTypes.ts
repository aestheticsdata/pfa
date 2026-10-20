/** What a request resolves to: the parsed body and the status, the two parts callers read. */
export interface ApiResponse<Data = unknown> {
  data: Data;
  status: number;
}

/** The request as callers describe it (PFA-243): plain-object or FormData `data`, extra headers. */
export interface RequestOptions {
  method?: string;
  data?: unknown;
  headers?: Record<string, string>;
  /** Upload progress — only an XHR can report it, so setting it switches the transport. */
  onUploadProgress?: (event: ProgressEvent) => void;
}
