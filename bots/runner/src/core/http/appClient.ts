import { HTTP_METHOD } from "@core/constants/http";
import { CookieJar } from "@core/http/cookieJar";

import type { AppClientOptions, HttpRequest, HttpResponse } from "@core/interfaces/httpTypes";

const CSRF_HEADER = "x-csrf-token";
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * One bot's HTTP session with its app: its own cookie jar and CSRF token, every request paced by
 * the runner's global RPS cap. It goes through the app's public URL — nginx, sessions, the
 * database — exactly like a browser, which is the whole point of synthetic users.
 */
export class AppClient {
  private readonly jar = new CookieJar();
  private csrfToken: string | undefined;

  constructor(private readonly options: AppClientOptions) {}

  setCsrfToken(token: string | undefined): void {
    this.csrfToken = token;
  }

  /** Forget the session entirely: the next request goes out as a stranger. */
  reset(): void {
    this.jar.clear();
    this.csrfToken = undefined;
  }

  get<T>(path: string): Promise<HttpResponse<T>> {
    return this.send<T>({ method: HTTP_METHOD.get, path });
  }

  post<T>(path: string, json?: unknown): Promise<HttpResponse<T>> {
    return this.send<T>({ method: HTTP_METHOD.post, path, json });
  }

  async send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    await this.options.throttle();
    const headers: Record<string, string> = { accept: "application/json" };
    const cookie = this.jar.header();
    if (cookie) {
      headers.cookie = cookie;
    }
    if (request.method !== HTTP_METHOD.get && this.csrfToken) {
      headers[CSRF_HEADER] = this.csrfToken;
    }
    let body: string | FormData | undefined;
    if (request.form) {
      body = request.form;
    } else if (request.json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(request.json);
    }

    const started = performance.now();
    let status = 0;
    try {
      const res = await fetch(`${this.options.baseUrl}${request.path}`, {
        method: request.method,
        headers,
        body,
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      status = res.status;
      this.jar.store(res.headers.getSetCookie());
      const text = await res.text();
      return { status, body: parseBody<T>(text) };
    } finally {
      this.options.onRequest?.({
        method: request.method,
        path: request.path,
        status,
        ms: Math.round(performance.now() - started),
      });
    }
  }
}

function parseBody<T>(text: string): T {
  if (text === "") {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}
