import { CATALOG_ENDPOINT, CATALOG_KIND, CATALOG_QUERY_KEY } from "@components/prices/config/constants";
import catalogConflict from "@components/prices/helpers/catalogConflict";
import { catalogQuery } from "@components/prices/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { invalidateFamilies } from "@lib/query/invalidate";
import { QUERY_KEYS } from "@lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CatalogDraft, CatalogKind, CatalogMerge } from "@components/prices/interfaces/catalogTypes";

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

  const entries = useQuery(catalogQuery(privateRequest, kind));

  const refresh = () => invalidateFamilies(queryClient, [CATALOG_QUERY_KEY[kind], ...AFFECTED_KEYS]);
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
