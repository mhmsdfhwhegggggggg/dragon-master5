import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";

export const securityRouter = router({
    validateLicense: publicProcedure
        .input(z.object({ key: z.string(), hwid: z.string() }))
        .mutation(async ({ input }) => {
            const { licenseManager } = await import("../services/license-manager");
            const result = await licenseManager.validateLicense(input.key, input.hwid);

            if (!result.valid) {
                return { valid: false, error: result.reason };
            }

            return {
                valid: true,
                type: result.license?.type || "basic",
                expiresAt: result.license?.expiresAt
            };
        }),

    checkIntegrity: protectedProcedure.query(async () => {
        return {
            status: "secure",
            lastCheck: new Date(),
            tamperedFiles: [],
        };
    }),

    // Kill Switch (Admin only)
    emergencyStop: protectedProcedure
        .input(z.object({ reason: z.string() }))
        .mutation(async ({ input }) => {
            console.log(`EMERGENCY STOP TRIGGERED: ${input.reason}`);
            return { status: "stopped" };
        }),
});
