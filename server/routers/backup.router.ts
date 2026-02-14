import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { BackupService } from "../services/backup.service";

export const backupRouter = router({
    listBackups: protectedProcedure.query(async () => {
        return BackupService.getBackups();
    }),

    createBackup: protectedProcedure.mutation(async () => {
        return await BackupService.createBackup();
    }),

    restoreBackup: protectedProcedure
        .input(z.object({ filename: z.string() }))
        .mutation(async ({ input }) => {
            const success = await BackupService.restoreBackup(input.filename);
            return { status: success ? "restored" : "failed", filename: input.filename };
        }),

    deleteBackup: protectedProcedure
        .input(z.object({ filename: z.string() }))
        .mutation(async ({ input }) => {
            const success = BackupService.deleteBackup(input.filename);
            return { status: success ? "deleted" : "failed" };
        }),
});
