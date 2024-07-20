import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getCategoriesSchema } from "../schemas/category";

export const categoryRouter = createTRPCRouter({
  getCategories: protectedProcedure
    .input(getCategoriesSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { page, pageSize } = input;

        const categories = await ctx.db.category.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            userCategories: {
              where: {
                userId: ctx.user?.id,
              },
              select: {
                checked: true,
              },
            },
          },
        });

        const categoryList = categories.map((category) => ({
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          checked:
            (category.userCategories.length > 0 &&
              category.userCategories[0]?.checked) ||
            false,
        }));

        return {
          success: true,
          data: categoryList,
          message: "Catagories returned successfully",
        };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        });
      }
    }),
});
