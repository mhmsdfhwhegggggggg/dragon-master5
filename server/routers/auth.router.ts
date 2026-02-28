import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db, users, getDb } from "../db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ENV } from "../_core/env";
import { hashPassword, verifyPassword } from "../_core/crypto";
import { COOKIE_NAME } from "../../shared/const.js";
import { getSessionCookieOptions } from "../_core/cookies";

export const authRouter = router({
    login: publicProcedure
        .input(z.object({ email: z.string().email(), password: z.string() }))
        .mutation(async ({ input }) => {
            const database = await getDb();
            if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not connected" });
            const user = await database.query.users.findFirst({
                where: eq(users.email, input.email),
            });

            if (!user || !verifyPassword(input.password, user.password)) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
            }

            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, ENV.jwtSecret, {
                expiresIn: "7d",
            });

            return { token, user: { id: user.id, email: user.email, username: user.username, role: user.role } };
        }),

    register: publicProcedure
        .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string() }))
        .mutation(async ({ input }) => {
            if (!ENV.enableRegistration) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Registration is disabled" });
            }

            const database = await getDb();
            if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not connected" });
            const existing = await database.query.users.findFirst({
                where: eq(users.email, input.email),
            });

            if (existing) {
                throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
            }

            const [newUser] = await database.insert(users).values({
                email: input.email,
                password: hashPassword(input.password),
                username: input.name,
                role: "user",
            }).returning();

            const token = jwt.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, ENV.jwtSecret, {
                expiresIn: "7d",
            });

            return { token, user: { id: newUser.id, email: newUser.email, username: newUser.username, role: newUser.role } };
        }),

    logout: publicProcedure
        .mutation(async ({ ctx }) => {
            if (ctx.res) {
                const options = getSessionCookieOptions(ctx.req);
                ctx.res.clearCookie(COOKIE_NAME, {
                    ...options,
                    maxAge: -1,
                });
            }
            return { success: true };
        }),
});
