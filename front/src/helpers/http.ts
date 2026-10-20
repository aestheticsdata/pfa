import type { ApiResponse, RequestOptions } from "@helpers/interfaces/httpTypes";

/**
 * A non-2xx answer (PFA-243). `response` keeps axios's shape — `{ status, data }` — so the callers
 * that read `error.response.status` or a server message from `error.response.data` are unchanged.
 */
export class ApiError extends Error {
  readonly response: ApiResponse;

  constructor(response: ApiResponse) {
    super(`Request failed with status code ${response.status}`);
    this.name = "ApiError";
    this.response = response;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/**
 * Like axios's default: JSON when the body parses as JSON, the raw text otherwise (the receipt
 * image arrives as a `data:` URL string), "" for an empty body.
 */
export const parseBody = (text: string): unknown => {
  if (text === "") return "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** FormData goes as-is (the browser writes the multipart boundary); anything else as JSON. */
const encodeBody = (options: RequestOptions) => {
  const headers: Record<string, string> = { ...options.headers };
  if (options.data === undefined) return { headers, body: undefined };
  if (options.data instanceof FormData) return { headers, body: options.data };
  return { headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(options.data) };
};

const settle = (response: ApiResponse) => {
  if (response.status < 200 || response.status >= 300) throw new ApiError(response);
  return response;
};

const sendWithProgress = (url: string, options: RequestOptions, onUploadProgress: (event: ProgressEvent) => void) =>
  new Promise<ApiResponse>((resolve, reject) => {
    const { headers, body } = encodeBody(options);
    const xhr = new XMLHttpRequest();
    xhr.open(options.method ?? "GET", url);
    xhr.withCredentials = true;
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = onUploadProgress;
    xhr.onload = () => {
      try {
        resolve(settle({ status: xhr.status, data: parseBody(xhr.responseText) }));
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new TypeError("Network request failed"));
    xhr.send(body ?? null);
  });

/**
 * One request with the session cookie, resolving to `{ data, status }` and rejecting with an
 * `ApiError` on a non-2xx status, as axios did. A network failure rejects with fetch's TypeError.
 */
export const send = async (url: string, options: RequestOptions = {}): Promise<ApiResponse> => {
  if (options.onUploadProgress) return sendWithProgress(url, options, options.onUploadProgress);

  const { headers, body } = encodeBody(options);
  const response = await fetch(url, { method: options.method ?? "GET", credentials: "include", headers, body });
  return settle({ status: response.status, data: parseBody(await response.text()) });
};
