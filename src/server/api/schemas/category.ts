import { number, object } from "zod";

export const getCategoriesSchema = object({
  page: number().min(1),
  pageSize: number().min(1).max(100),
});
