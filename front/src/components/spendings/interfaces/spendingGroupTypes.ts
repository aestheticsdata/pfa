import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";
import type {
  DAY_ENTRY_KIND,
  GROUP_ROW_ACTION,
  ROW_CONFIRM_TONE,
  SPENDING_MODAL_MODE,
} from "@components/spendings/config/constants";
import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

export type DayEntryKind = (typeof DAY_ENTRY_KIND)[keyof typeof DAY_ENTRY_KIND];
export type SpendingModalMode = (typeof SPENDING_MODAL_MODE)[keyof typeof SPENDING_MODAL_MODE];

/** A plain spending as a day-card row. */
export interface SingleDayEntry {
  kind: typeof DAY_ENTRY_KIND.spending;
  ID: string;
  label: string;
  /** Sort key of the "Categories" button. */
  category: string | null;
  amount: number;
  date: string;
  invoicefile: string | null;
  spending: SpendingItem;
  /** The spending IDs a receipt action on this row applies to. */
  spendingIDs: string[];
}

/** A group (PFA-189) as one collapsible day-card row. */
export interface GroupDayEntry {
  kind: typeof DAY_ENTRY_KIND.group;
  /** The group's ID. */
  ID: string;
  label: string;
  /** The first line's category — the group sorts as one block. */
  category: string | null;
  /** Sum of the lines. */
  amount: number;
  date: string;
  invoicefile: string | null;
  lines: SpendingItem[];
  spendingIDs: string[];
}

export type DayEntry = SingleDayEntry | GroupDayEntry;

/** One line of the group editor in the spending modal. */
export interface GroupLineDraft {
  /** Stable React key; also the spending's ID when editing an existing line. */
  key: string;
  ID: string | null;
  category: CategoryOption | null;
  detail: string;
  /** As typed: may be an expression ("12+3.5"), evaluated on submit. */
  amount: string;
}

/** Group payload of POST/PUT /spendings/groups. */
export interface SpendingGroupLinePayload {
  ID?: string;
  detail: string;
  amount: number;
  category: CategoryOption | null;
}

export interface CreateSpendingGroupInput {
  date: string;
  label: string;
  currency: string;
  lines: SpendingGroupLinePayload[];
  receiptFile: File | null;
}

export interface UpdateSpendingGroupInput {
  ID: string;
  label: string;
  lines: SpendingGroupLinePayload[];
}

/** "Group N spendings": an existing spending and its detail in the new group. */
export interface MergeLineInput {
  spendingID: string;
  detail: string;
}

export interface MergeSpendingGroupInput {
  label: string;
  date: string;
  lines: MergeLineInput[];
  /** Uploaded on the group only when none of the merged spendings had a receipt. */
  receiptFile: File | null;
}

export interface ShareReceiptInput {
  spendingIDs: string[];
  file: File;
  /** Names the stored file, like a single upload: label + date. */
  label: string;
  date: string;
}

/** One category's slice of a group's stacked colour pill. */
export interface PillStop {
  color: string;
  amount: number;
}

/** The page-level states a day-card row is drawn with (PFA-189). */
export interface EntryRowFlags {
  isSelecting: boolean;
  isSelected: boolean;
  isReceiptHighlighted: boolean;
  isFlashing: boolean;
}

/** What a day card's sort buttons read — a spending, or a group as one block (PFA-189). */
export interface DaySortable {
  label: string;
  category?: string | null;
  amount: number;
}

/** A ticked row and the day card it sits in (PFA-189). */
export interface SelectedEntry {
  entry: DayEntry;
  dayIso: string;
}

export type RowConfirmTone = (typeof ROW_CONFIRM_TONE)[keyof typeof ROW_CONFIRM_TONE];
export type GroupRowAction = (typeof GROUP_ROW_ACTION)[keyof typeof GROUP_ROW_ACTION];
