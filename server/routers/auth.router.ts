import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db, users } from "../db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ENV } from "../_core/env";
import { hashPassword, verifyPassword } from "../_core/crypto";

export const authRouter = router({
    login: publicProcedure
        .input(z.object({ email: z.string().email(), password: z.string() }))
        .mutation(async ({ input }) => {
            const user = await db.query.users.findFirst({
                where: eq(users.email, input.email),
            });

            if (!user || !verifyPassword(input.password, user.password)) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
            }

            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, ENV.jwtSecret, {
                expiresIn: "7d",
            });

            return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
        }),

    register: publicProcedure
        .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string() }))
        .mutation(async ({ input }) => {
            if (!ENV.enableRegistration) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Registration is disabled" });
            }

            const existing = await db.query.users.findFirst({
                where: eq(users.email, input.email),
            });

            if (existing) {
                throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
            }

            const [newUser] = await db.insert(users).values({
                email: input.email,
                password: hashPassword(input.password),
                name: input.name,
                role: "user",
            }).returning();

            const token = jwt.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, ENV.jwtSecret, {
                expiresIn: "7d",
            });

            return { token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } };
        }),

    logout: publicProcedure
        .mutation(async () => {
            return { success: true };
        }),
});
