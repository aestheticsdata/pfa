import { ProductTypeListSchema, StoreListSchema } from "#schemas/receiptLines";

import type { ApiClient } from "#api/interfaces/httpTypes";

/** The stores the user's receipts named (PFA-218). */
export const fetchStores = (api: ApiClient) => api.get("/stores", StoreListSchema);

export const fetchProductTypes = (api: ApiClient) => api.get("/product-types", ProductTypeListSchema);
