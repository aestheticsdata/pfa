import {
  CATALOG_ENDPOINT,
  CATALOG_KIND,
  CATALOG_QUERY_KEY,
  CATALOG_USAGE_KEY,
} from "@components/prices/config/constants";
import catalogConflict from "@components/prices/helpers/catalogConflict";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import { ProductTypeEntryListSchema, StoreEntryListSchema } from "@src/schemas/prices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CatalogDraft, CatalogEntry, CatalogKind, CatalogMerge } from "@components/prices/interfaces/catalogTypes";

// What a store or type change shows elsewhere: the pickers, the prices, a spending's store.
const AFFECTED_KEYS = [
  QUERY_KEYS.PRICES,
  QUERY_KEYS.SPENDINGS_BY_MONTH,
  QUERY_KEYS.SPENDINGS_SEARCH,
  QUERY_KEYS.RECEIPT_LINES,
];

/**
 * The user's stores or product types to manage (PFA-224): listed with their
 * uses and likely duplicates, renamed, merged, deleted when unused.
 */
const useCatalog = (kind: CatalogKind) => {
  const { catalog: t } = useTranslations("prices");
  const { privateRequest } = useRequestHelper();
  const queryClient = useQueryClient();
  const endpoint = CATALOG_ENDPOINT[kind];

  const entries = useQuery({
    queryKey: [CATALOG_QUERY_KEY[kind], CATALOG_USAGE_KEY],
    queryFn: async (): Promise<CatalogEntry[]> => {
      const response = await privateRequest(`${endpoint}/usage`);
      if (kind === CATALOG_KIND.stores) {
        return parseResponse(StoreEntryListSchema, response.data, `${endpoint}/usage`);
      }
      const types = parseResponse(ProductTypeEntryListSchema, response.data, `${endpoint}/usage`);
      return types.map((type) => ({ ...type, address: null }));
    },
  });

  const refresh = () =>
    Promise.all(
      [CATALOG_QUERY_KEY[kind], ...AFFECTED_KEYS].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
    );
  // A collision is the row's to show, as a merge offer; anything else is a toast.
  const report = (error: unknown) => {
    if (!catalogConflict(error)) toast.error(t.failed);
  };

  const rename = useMutation({
    mutationFn: (draft: CatalogDraft) =>
      privateRequest(`${endpoint}/${draft.ID}`, {
        method: "PATCH",
        data: kind === CATALOG_KIND.stores ? { name: draft.name, address: draft.address } : { name: draft.name },
      }),
    onSuccess: refresh,
    onError: report,
  });

  const merge = useMutation({
    mutationFn: ({ sourceID, targetID }: CatalogMerge) =>
      privateRequest(`${endpoint}/${sourceID}/merge`, { method: "POST", data: { targetID } }),
    onSuccess: refresh,
    onError: report,
  });

  const remove = useMutation({
    mutationFn: (entryID: string) => privateRequest(`${endpoint}/${entryID}`, { method: "DELETE" }),
    onSuccess: refresh,
    onError: report,
  });

  return { entries, rename, merge, remove };
};

export default useCatalog;
