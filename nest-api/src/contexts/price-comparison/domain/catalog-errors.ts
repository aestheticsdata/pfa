import { ConflictError, InvalidInputError, NotFoundError } from "@shared-kernel/domain-error";

// Messages kept word for word: they are what the client has always received.

export class StoreNotFound extends NotFoundError {
  constructor() {
    super("Store not found");
  }
}

export class ProductTypeNotFound extends NotFoundError {
  constructor() {
    super("Product type not found");
  }
}

export class EmptyStoreName extends InvalidInputError {
  constructor() {
    super("Store name is empty");
  }
}

export class EmptyProductTypeName extends InvalidInputError {
  constructor() {
    super("Product type name is empty");
  }
}

/** Another entry already bears the name: the client offers to merge into `conflictID`. */
export class StoreExists extends ConflictError {
  constructor(conflictID: string) {
    super("Store already exists", { conflictID });
  }
}

export class ProductTypeExists extends ConflictError {
  constructor(conflictID: string) {
    super("Product type already exists", { conflictID });
  }
}

export class StoreSelfMerge extends InvalidInputError {
  constructor() {
    super("A store cannot merge into itself");
  }
}

export class ProductTypeSelfMerge extends InvalidInputError {
  constructor() {
    super("A product type cannot merge into itself");
  }
}

export class StoreInUse extends ConflictError {
  constructor() {
    super("Store is in use");
  }
}

export class ProductTypeInUse extends ConflictError {
  constructor() {
    super("Product type is in use");
  }
}
