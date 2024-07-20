import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { env } from "~/env";
import { db } from "~/server/db";

export const deserializeUser = async () => {
  const cookieStore = cookies();
  try {
    let token;
    if (cookieStore.get("token")) {
      token = cookieStore.get("token")?.value;
    }
    const notAuthenticated = { user: null };

    if (!token) {
      return notAuthenticated;
    }
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };

    if (!decoded) {
      return notAuthenticated;
    }

    const user = await db.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return notAuthenticated;
    }

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
    };
  } catch (err: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: err.message,
    });
  }
};
