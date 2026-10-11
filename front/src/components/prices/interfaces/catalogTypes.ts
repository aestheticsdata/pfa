import type { CATALOG_KIND, CATALOG_ROW_MODE } from "@components/prices/config/constants";

export type CatalogKind = (typeof CATALOG_KIND)[keyof typeof CATALOG_KIND];
export type CatalogRowMode = (typeof CATALOG_ROW_MODE)[keyof typeof CATALOG_ROW_MODE];

/** A store or a product type in the management dialog (PFA-224); a type has no address. */
export interface CatalogEntry {
  ID: string;
  name: string;
  address: string | null;
  uses: number;
  duplicateOf: string | null;
}

/** An entry's new name, and address for a store. */
export interface CatalogDraft {
  ID: string;
  name: string;
  address: string | null;
}

/** One entry merged into another: its purchases move, it goes. */
export interface CatalogMerge {
  sourceID: string;
  targetID: string;
}
