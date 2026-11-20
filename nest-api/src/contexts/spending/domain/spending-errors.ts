import { InvalidInputError, NotFoundError } from "@shared-kernel/domain-error";

// Messages kept word for word: they are what the client has always received.

export class SpendingNotFound extends NotFoundError {
  constructor() {
    super("Spending not found");
  }
}

export class GroupNotFound extends NotFoundError {
  constructor() {
    super("Group not found");
  }
}

export class CategoryNotUsable extends InvalidInputError {
  constructor() {
    super("Invalid category ID");
  }
}

export class LineNotInGroup extends InvalidInputError {
  constructor() {
    super("Line does not belong to the group");
  }
}

export class GroupSpansSeveralDays extends InvalidInputError {
  constructor() {
    super("A group spans a single day");
  }
}

export class DuplicateSpending extends InvalidInputError {
  constructor() {
    super("Duplicate spending");
  }
}
