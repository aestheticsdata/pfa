import { ConflictError, InvalidInputError, NotFoundError } from "@shared-kernel/domain-error";

// Messages kept word for word: they are what the client has always received.

export class SpendingNotFound extends NotFoundError {
  constructor() {
    super("Spending not found");
  }
}

/** The spending has no receipt to read. */
export class NoReceipt extends InvalidInputError {
  constructor() {
    super("NO_RECEIPT");
  }
}

/** An upload that is not an image the store can keep. */
export class InvalidReceiptImage extends InvalidInputError {
  constructor() {
    super("INVALID_IMAGE_FILE");
  }
}

/** A file name reaching outside the user's own folder. */
export class InvalidReceiptPath extends InvalidInputError {
  constructor() {
    super("Invalid file path");
  }
}

/** A bulk-read entry is read once: only a queued one takes a result. */
export class ReceiptNotQueued extends ConflictError {
  constructor() {
    super("Receipt is not queued");
  }
}
