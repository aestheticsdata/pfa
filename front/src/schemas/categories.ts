import { z } from "zod";

export const CategorySchema = z.object({
  ID: z.string(),
  userID: z.string().nullable(),
  name: z.string(),
  color: z.string(),
});

export type Category = z.infer<typeof CategorySchema>;
export const CategoryListSchema = z.array(CategorySchema);

export const UpdateCategoryPayloadSchema = z.object({
  ID: z.string(),
  userID: z.string().nullable(),
  name: z.string().min(1),
  color: z.string().min(1),
});

export type UpdateCategoryPayload = z.infer<typeof UpdateCategoryPayloadSchema>;
