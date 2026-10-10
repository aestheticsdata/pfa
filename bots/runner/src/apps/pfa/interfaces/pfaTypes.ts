import type { AppClient } from "@core/http/appClient";

export interface PfaCategory {
  name: string;
  color: string;
}

/** Something a bot buys: a label, its category, and the price range it costs. */
export interface CatalogItem {
  label: string;
  category: PfaCategory;
  min: number;
  max: number;
  /** How often it's bought, relative to the bot's other items. */
  weight: number;
  /** A bill: entered once a month at most. */
  monthly: boolean;
}

/** How a catalog line is written: price range, relative frequency, and whether it's a monthly bill. */
export interface ItemHabit {
  range: [number, number];
  weight: number;
  monthly?: boolean;
}

/** A PFA bot's habits. */
export interface PfaPersona {
  description: string;
  catalog: CatalogItem[];
  /** Average receipts uploaded per week; drawn once per bot, around 2 (PFA-124). */
  receiptsPerWeek: number;
}

/** One of the fixed receipt pictures — the only bytes a bot may ever upload. */
export interface ReceiptImage {
  name: string;
  bytes: Uint8Array;
  sha256: string;
}

/** The last spending a bot created, so a receipt can be attached to it. */
export interface CreatedSpending {
  ID: string;
  date: string;
  label: string;
  /** Decided when the spending is made: this one gets a receipt, at the bot's own pace. */
  wantsReceipt: boolean;
  hasReceipt: boolean;
}

export interface ReceiptUpload {
  spending: CreatedSpending;
  image: ReceiptImage;
}

export interface MonthRange {
  from: string;
  to: string;
}

export interface SignInBody {
  csrfToken?: string;
  message?: string;
}

/** What every PFA action needs from its context. */
export interface PfaClient {
  client: AppClient;
}
