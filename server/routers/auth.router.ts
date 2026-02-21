import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db, users } from "../db";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";
import { hashPassword, verifyPassword } from "../_core/crypto";
import { sdk } from "../_core/sdk";

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

            // Standardize token generation via SDK
            const token = await sdk.createSessionToken(user.email, { name: user.username });

            return { token, user: { id: user.id, email: user.email, name: user.username, role: user.role } };
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

            // Strategy: Raw Postgres-JS Client Bypass (Proven Stable)
            try {
                // Ensure DB is initialized and get raw client
                const { getDb, client } = await import("../db");
                await getDb();

                // Attempt 1: Modern Schema
                const result = await client`
                    INSERT INTO users (email, password, username, role, "isActive")
                    VALUES (${input.email}, ${hashPassword(input.password)}, ${input.name}, 'user', true)
                    RETURNING id, email, username, role
                `;

                const newUser = result[0];
                if (!newUser) throw new Error("Raw Insert returned no result");

                // Standardize token generation via SDK
                const token = await sdk.createSessionToken(newUser.email, { name: newUser.username });
                return { token, user: { id: newUser.id, email: newUser.email, name: newUser.username, role: newUser.role } };
            } catch (error: any) {
                console.warn("[Auth] Raw Primary insert failed, trying Raw Fallback (Legacy):", error.message);

                try {
                    const { client } = await import("../db");
                    const result = await client`
                        INSERT INTO users (email, password, name, role)
                        VALUES (${input.email}, ${hashPassword(input.password)}, ${input.name}, 'user')
                        RETURNING id, email, name, role
                    `;

                    const newUser = result[0];
                    if (!newUser) throw new Error("Raw Fallback insert returned no result");

                    // Standardize token generation via SDK
                    const token = await sdk.createSessionToken(newUser.email, { name: newUser.name });
                    return { token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } };
                } catch (fallbackError: any) {
                    console.error("[Auth] Registration FATAL failure:", fallbackError);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Registration failed definitively: ${fallbackError.message}`
                    });
                }
            }
        }),

    logout: publicProcedure
        .mutation(async () => {
            return { success: true };
        }),
});
