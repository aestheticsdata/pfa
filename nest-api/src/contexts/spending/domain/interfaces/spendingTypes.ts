import type { CATEGORY_CHOICE } from "@contexts/spending/domain/category-choice";
import type { CalendarDay } from "@shared-kernel/calendar-day";
import type { Money } from "@shared-kernel/money";

/** The category picked or typed in the spending modal, as the front sends it. */
export interface CategoryPick {
  ID?: string | null;
  name?: string;
  color?: string | null;
}

/** A category typed by name in the modal, created on the fly when the user has none by that name. */
export interface TypedCategory {
  name: string;
  color: string;
}

/** What a category pick asks for, before any lookup (PFA-273). */
export type CategoryChoice =
  | { kind: typeof CATEGORY_CHOICE.existing; categoryId: string }
  | { kind: typeof CATEGORY_CHOICE.unchanged; categoryId: string }
  | { kind: typeof CATEGORY_CHOICE.typed; category: TypedCategory }
  | { kind: typeof CATEGORY_CHOICE.none };

export interface SpendingState {
  id: string;
  ownerId: string;
  date: CalendarDay;
  label: string;
  amount: Money;
  categoryId: string | null;
  receipt: string | null;
  groupId: string | null;
}

export interface NewSpending {
  id: string;
  ownerId: string;
  date: CalendarDay;
  label: string;
  amount: Money;
  categoryId: string | null;
}

export interface SpendingRevision {
  label: string;
  amount: number;
  categoryId: string | null;
}

/** One line of a group: a spending whose label is composed from the group's (PFA-189). */
export interface GroupLineState {
  id: string;
  amount: Money;
  categoryId: string | null;
  detail: string | null;
  receipt: string | null;
  /** Not yet stored: written whole, with the group's date. */
  isNew: boolean;
}

export interface SpendingGroupState {
  id: string;
  ownerId: string;
  date: CalendarDay;
  label: string;
  lines: GroupLineState[];
}

export interface NewGroupLine {
  id: string;
  amount: number;
  categoryId: string | null;
  detail?: string | null;
}

/** A line of the edited group: `isNew` when it was added in the modal. */
export interface EditedGroupLine extends NewGroupLine {
  isNew: boolean;
}

export interface NewSpendingGroup {
  id: string;
  ownerId: string;
  date: CalendarDay;
  label: string;
  currency: string;
  lines: NewGroupLine[];
}

export interface GroupEdit {
  label: string;
  lines: EditedGroupLine[];
}

/** An existing spending joining a new group (merge), with what it carries in. */
export interface GroupCandidate {
  id: string;
  date: CalendarDay;
  amount: Money;
  categoryId: string | null;
  receipt: string | null;
  groupId: string | null;
  /** Its detail in the new group, as sent. */
  detail?: string | null;
}

export interface GroupMerge {
  id: string;
  ownerId: string;
  label: string;
  /** In the order sent: the first receipt found is kept for the whole group. */
  candidates: GroupCandidate[];
}
