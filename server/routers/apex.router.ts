import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import { apexOrchestrator } from '../services/apex-orchestrator.service';

export const apexRouter = router({
    /**
     * Delegate a high-level autonomous mission to the Apex Brain
     */
    delegateMission: adminProcedure
        .input(z.object({
            objective: z.string(),
            context: z.record(z.string(), z.any()).optional()
        }))
        .mutation(async ({ input }) => {
            const missionId = await apexOrchestrator.delegateMission(input.objective, input.context);
            return {
                success: true,
                message: 'Mission delegated to Apex Brain 🧠',
                missionId
            };
        }),

    /**
     * Get the status of an active apex task
     */
    getTaskStatus: adminProcedure
        .input(z.object({
            taskId: z.string()
        }))
        .query(async ({ input }) => {
            const status = apexOrchestrator.getTaskStatus(input.taskId);
            if (!status) {
                throw new Error('Task not found');
            }
            return {
                success: true,
                data: status
            };
        })
});
