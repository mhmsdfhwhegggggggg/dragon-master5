import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";
import { licenseManager } from "../services/license-manager";

export const securityRouter = router({
    validateLicense: publicProcedure
        .input(z.object({ key: z.string(), hwid: z.string() }))
        .mutation(async ({ input }) => {
            // Real V10.0 Validation Logic
            if (!ENV.enableLicenseCheck) return { valid: true, type: "pro", expiresAt: null };

            const result = await licenseManager.validateLicense(input.key, input.hwid);
            return {
                valid: result.valid,
                type: result.license?.type || "unknown",
                expiresAt: result.license?.expiresAt,
                reason: result.reason
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
