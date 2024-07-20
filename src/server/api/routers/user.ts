import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { env } from "~/env";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import sendEmail from "~/server/utils/sendMail";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
} from "../schemas/user";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        const verifyCode = Math.floor(
          10000000 + Math.random() * 90000000,
        ).toString();

        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        if (existingUser) {
          if (existingUser.isVerified) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "User already exists with this email",
            });
          } else {
            const hashedPassword = await bcrypt.hash(input.password, 10);

            await ctx.db.user.update({
              where: {
                email: existingUser.email,
              },
              data: {
                password: hashedPassword,
                verifyCode,
                verifyCodeExpiry: expiryDate,
              },
            });
          }
        } else {
          const hashedPassword = await bcrypt.hash(input.password, 10);

          await ctx.db.user.create({
            data: {
              email: input.email,
              name: input.name,
              password: hashedPassword,
              verifyCode,
              verifyCodeExpiry: expiryDate,
            },
          });
        }

        const text = `
              Dear ${input.name},

              Welcome to ECOMMERCE!

              Thank you for signing up. To complete your registration and activate your account, please verify your email address by entering the following 8-digit verification code on the verification page:

              Your Verification Code: ${verifyCode}

              If you didn't sign up for an account, please disregard this email.

              Best regards,

              Shobhan Sundar Goutam,
              (Founder, Whispr)
            `;

        await sendEmail({
          email: input.email,
          subject: "Verify your email address",
          text,
        });

        return {
          success: true,
          message: "User Registered successfully",
        };
      } catch (error: any) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        });
      }
    }),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    try {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user || !(await bcrypt.compare(input.password, user.password))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRY,
      });

      const cookieOptions = {
        httpOnly: true,
        path: "/",
        secure: env.NODE_ENV !== "development",
        maxAge: 60 * 60,
      };

      cookies().set("token", token, cookieOptions);

      return {
        status: "success",
        token,
      };
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal Server Error",
      });
    }
  }),

  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const isVerifyCodeValid = user.verifyCode === input.verifyCode;
        const isVerifyCodeNotExpired =
          new Date(user.verifyCodeExpiry) > new Date();

        if (isVerifyCodeValid && isVerifyCodeNotExpired) {
          await ctx.db.user.update({
            where: {
              email: user.email,
            },
            data: {
              isVerified: true,
            },
          });

          return {
            success: true,
            message: "Account verified successfully",
          };
        } else if (!isVerifyCodeNotExpired) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Verification code has expired. Please Register again to get a new verification code",
          });
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Incorrect Verification code",
          });
        }
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        });
      }
    }),

  logout: protectedProcedure.mutation(() => {
    try {
      cookies().set("token", "", { maxAge: -1 });
      return {
        success: true,
        message: "User Logged Out successfully",
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
