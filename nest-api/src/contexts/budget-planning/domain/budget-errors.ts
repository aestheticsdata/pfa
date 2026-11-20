import { InvalidInputError, NotFoundError } from "@shared-kernel/domain-error";

// Messages kept word for word: they are what the client has always received.

export class CategoryNotFound extends NotFoundError {
  constructor() {
    super("Category not found");
  }
}

export class CategoryNotUsable extends InvalidInputError {
  constructor() {
    super("Invalid category ID");
  }
}

export class RecurringNotFound extends NotFoundError {
  constructor() {
    super("Recurring not found");
  }
}

export class ExceptionalNotFound extends NotFoundError {
  constructor() {
    super("Exceptional not found");
  }
}

/** The month's budget is the `Dashboards` row, and the route still says so. */
export class MonthlyBudgetNotFound extends NotFoundError {
  constructor() {
    super("Dashboard not found");
  }
}
