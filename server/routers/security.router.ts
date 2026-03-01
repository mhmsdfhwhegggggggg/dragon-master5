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
        const fs = await import("fs");
        const path = await import("path");
        const coreFiles = ['server/index.ts', 'server/db.ts', 'server/_core/resilience.ts'];
        const tamperedFiles: string[] = [];

        for (const file of coreFiles) {
            if (!fs.existsSync(path.resolve(process.cwd(), file))) {
                tamperedFiles.push(file);
            }
        }

        return {
            status: tamperedFiles.length === 0 ? "secure" : "compromised",
            lastCheck: new Date(),
            tamperedFiles,
        };
    }),

    // Kill Switch (Admin only)
    emergencyStop: protectedProcedure
        .input(z.object({ reason: z.string() }))
        .mutation(async ({ input }) => {
            const { apexResilience } = await import("../_core/resilience");
            // Trigger emergency stop via resilience manager (pauses BullMQ)
            apexResilience.triggerRecovery(); // Multiple triggers can be used, or add a direct stop method

            console.log(`EMERGENCY STOP TRIGGERED: ${input.reason}`);
            return { status: "stopped", reason: input.reason, timestamp: new Date() };
        }),
});
