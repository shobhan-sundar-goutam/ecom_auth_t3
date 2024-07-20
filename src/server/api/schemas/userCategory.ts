import { number, object, string } from "zod";

export const userCategorySchema = object({
  userId: string(),
  categoryId: number(),
});
