import type { QueryParams } from "#api/interfaces/httpTypes";

/**
 * JSON when the body parses as JSON, the raw text otherwise (the receipt image arrives as a
 * `data:` URL string), "" for an empty body.
 */
export const parseBody = (text: string): unknown => {
  if (text === "") return "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** FormData goes as-is (the platform writes the multipart boundary); anything else as JSON. */
export const encodeBody = (data: unknown) => {
  if (data === undefined) return { contentType: null, body: undefined };
  if (data instanceof FormData) return { contentType: null, body: data };
  return { contentType: "application/json", body: JSON.stringify(data) };
};

/** `path` + the query, with null and undefined values left out. */
export const buildUrl = (baseUrl: string, path: string, query?: QueryParams) => {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) params.append(name, String(value));
  }
  const search = params.toString();
  return `${baseUrl}${path}${search === "" ? "" : `?${search}`}`;
};
