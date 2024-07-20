import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userCategorySchema } from "../schemas/userCategory";

export const userCategoryRouter = createTRPCRouter({
  upsertUserCategory: protectedProcedure
    .input(userCategorySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { userId, categoryId } = input;

        const existingRecord = await ctx.db.userCategory.findUnique({
          where: {
            userId_categoryId: {
              userId,
              categoryId,
            },
          },
        });

        if (existingRecord) {
          const updatedRecord = await ctx.db.userCategory.update({
            where: {
              userId_categoryId: {
                userId,
                categoryId,
              },
            },
            data: {
              checked: !existingRecord.checked,
            },
          });

          return {
            success: true,
            data: updatedRecord,
            message: "User's Catagory updated successfully",
          };
        } else {
          const newRecord = await ctx.db.userCategory.create({
            data: {
              userId,
              categoryId,
              checked: true,
            },
          });

          return {
            success: true,
            data: newRecord,
            message: "User's Catagory inserted successfully",
          };
        }
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        });
      }
    }),
});
