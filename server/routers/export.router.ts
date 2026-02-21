import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const exportRouter = router({
    exportMembers: protectedProcedure
        .input(z.object({
            groupId: z.string(),
            format: z.enum(["txt", "csv"]),
            filters: z.object({
                hasUsername: z.boolean().optional(),
                isAdded: z.boolean().optional(),
            }).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { groupId, format, filters } = input;
            const userId = ctx.user?.id || 1;

            try {
                const members = await db.getExtractedMembersByAccountAndGroup(userId, groupId);

                if (members.length === 0) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "No members found for this group.",
                    });
                }

                let filteredMembers = members;
                if (filters) {
                    if (filters.hasUsername) {
                        filteredMembers = filteredMembers.filter(m => !!m.memberUsername);
                    }
                    if (filters.isAdded !== undefined) {
                        filteredMembers = filteredMembers.filter(m => m.isAdded === filters.isAdded);
                    }
                }

                let content = "";
                let fileName = `members_${groupId}_${new Date().getTime()}`;

                if (format === "txt") {
                    content = filteredMembers.map(m =>
                        m.memberUsername
                            ? `@${m.memberUsername}`
                            : `${m.memberTelegramId} (${m.memberFirstName || 'Unknown'})`
                    ).join("\n");
                    fileName += ".txt";
                } else {
                    content = "ID,Username,FirstName,LastName,Phone,ExtractionDate\n";
                    content += filteredMembers.map(m =>
                        `${m.memberTelegramId},${m.memberUsername || ''},${m.memberFirstName || ''},${m.memberLastName || ''},${m.memberPhone || ''},${m.extractionDate.toISOString()}`
                    ).join("\n");
                    fileName += ".csv";
                }

                return {
                    fileName,
                    content,
                    type: format === "txt" ? "text/plain" : "text/csv",
                    count: filteredMembers.length
                };

            } catch (error: any) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message,
                });
            }
        }),
});
