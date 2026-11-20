import { ApiError } from "#api/apiError";
import { buildUrl, encodeBody, parseBody } from "#api/body";
import { HTTP_METHOD } from "#api/httpMethod";
import { parseResponse } from "#schemas/parseResponse";

import type { z } from "zod";
import type {
  ApiClient,
  ApiClientConfig,
  ApiResponse,
  OutgoingRequest,
  QueryParams,
  RequestOptions,
  WriteRequest,
} from "#api/interfaces/httpTypes";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

const isSuccess = (response: ApiResponse) => response.status >= 200 && response.status < 300;
const isAuthFailure = (response: ApiResponse) =>
  response.status === HTTP_UNAUTHORIZED || response.status === HTTP_FORBIDDEN;

/**
 * The HTTP client both apps use. Paths are the API's routes ("/spendings"); the auth strategy
 * decides how the request is signed and whether a 401/403 is worth one retry. Responses read with
 * `get` / `send` go through their zod schema, so a contract drift fails loudly in dev and reaches
 * `onDrift` everywhere.
 */
export const createApiClient = (config: ApiClientConfig): ApiClient => {
  const fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);

  const attempt = async (path: string, options: RequestOptions): Promise<ApiResponse> => {
    const outgoing: OutgoingRequest = { method: options.method ?? HTTP_METHOD.get, path };
    const { contentType, body } = encodeBody(options.data);
    const headers = {
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(await config.auth.authorize(outgoing)),
      ...options.headers,
    };
    const response = await fetchImpl(buildUrl(config.baseUrl, path, options.query), {
      method: outgoing.method,
      headers,
      body,
      credentials: config.auth.credentials,
    });
    return { status: response.status, data: parseBody(await response.text()) };
  };

  const request = async (path: string, options: RequestOptions = {}) => {
    const first = await attempt(path, options);
    if (isSuccess(first)) return first;
    if (!isAuthFailure(first)) throw new ApiError(first);

    const retry = await config.auth.recover({
      status: first.status,
      request: { method: options.method ?? HTTP_METHOD.get, path },
      fetchRaw: (rawPath: string) => attempt(rawPath, {}),
    });
    if (!retry) throw new ApiError(first);

    const second = await attempt(path, options);
    if (!isSuccess(second)) throw new ApiError(second);
    return second;
  };

  const get = async <Schema extends z.ZodType>(path: string, schema: Schema, query?: QueryParams) => {
    const response = await request(path, query ? { query } : {});
    return parseResponse(schema, response.data, { endpoint: path, onDrift: config.onDrift });
  };

  const send = async <Schema extends z.ZodType>(path: string, write: WriteRequest<Schema>) => {
    const response = await request(path, { method: write.method, data: write.data });
    return parseResponse(write.schema, response.data, { endpoint: path, onDrift: config.onDrift });
  };

  return { request, get, send };
};
