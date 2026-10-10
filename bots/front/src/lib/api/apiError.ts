import type { ApiErrorBody } from "@contracts/interfaces/authTypes";

/** A refused call to the back-office API, with what the API said. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message.join(" · ") : body.message);
    this.status = status;
    this.body = body;
  }
}
