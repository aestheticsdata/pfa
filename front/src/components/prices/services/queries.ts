import {
  CATALOG_ENDPOINT,
  CATALOG_KIND,
  CATALOG_QUERY_KEY,
  CATALOG_USAGE_KEY,
} from "@components/prices/config/constants";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import {
  PriceComparisonSchema,
  ProductTypeEntryListSchema,
  ProductTypeSummaryListSchema,
  StoreEntryListSchema,
} from "@src/schemas/prices";
import { BulkReadStatusSchema, PendingProposalSchema } from "@src/schemas/receiptLines";
import { queryOptions } from "@tanstack/react-query";

import type { CatalogEntry, CatalogKind } from "@components/prices/interfaces/catalogTypes";
import type { PrivateRequest } from "@helpers/interfaces/httpTypes";

// Every query of the prices module, declared once (PFA-253) — see spendings/services/queries.ts.

const BULK_READ_ENDPOINT = "/receipt-proposals";

/** The product types with a price history, for the comparison picker. */
export const priceTypesQuery = (request: PrivateRequest) =>
  queryOptions({
    queryKey: [QUERY_KEYS.PRICES],
    queryFn: async () => {
      const response = await request("/prices");
      return parseResponse(ProductTypeSummaryListSchema, response.data, "/prices");
    },
  });

export const priceComparisonQuery = (request: PrivateRequest, typeID: string | null) =>
  queryOptions({
    queryKey: [QUERY_KEYS.PRICES, typeID],
    queryFn: async () => {
      const response = await request(`/prices/${typeID}`);
      return parseResponse(PriceComparisonSchema, response.data, "/prices/:typeID");
    },
    enabled: typeID !== null,
  });

/** A catalog (stores or product types) with how many receipt lines use each entry. */
export const catalogQuery = (request: PrivateRequest, kind: CatalogKind) =>
  queryOptions({
    queryKey: [CATALOG_QUERY_KEY[kind], CATALOG_USAGE_KEY],
    queryFn: async (): Promise<CatalogEntry[]> => {
      const endpoint = `${CATALOG_ENDPOINT[kind]}/usage`;
      const response = await request(endpoint);
      if (kind === CATALOG_KIND.stores) {
        return parseResponse(StoreEntryListSchema, response.data, endpoint);
      }
      const types = parseResponse(ProductTypeEntryListSchema, response.data, endpoint);
      return types.map((type) => ({ ...type, address: null }));
    },
  });

/** Where the bulk receipt reading stands: how many receipts are queued, read, ready to review. */
export const bulkReadStatusQuery = (request: PrivateRequest) =>
  queryOptions({
    queryKey: [QUERY_KEYS.RECEIPT_PROPOSALS],
    queryFn: async () => {
      const response = await request(BULK_READ_ENDPOINT);
      return parseResponse(BulkReadStatusSchema, response.data, BULK_READ_ENDPOINT);
    },
  });

/** The next read receipt waiting for review, or null when the queue is done. */
export const nextProposalQuery = (request: PrivateRequest) =>
  queryOptions({
    queryKey: [QUERY_KEYS.RECEIPT_PROPOSAL_NEXT],
    queryFn: async () => {
      const endpoint = `${BULK_READ_ENDPOINT}/next`;
      const response = await request(endpoint);
      return parseResponse(PendingProposalSchema, response.data, endpoint);
    },
  });
