import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Job payload stored in Redis queue
 */
export interface QueueJobPayload {
    jobId: string;           // Convex job ID
    workspaceId: string;     // For context
    prompt: string;
    model: string;
    inputImageUrls: string[];
    priority: number;
    createdAt: number;
}

/**
 * Create a new generation job (status: queued)
 */
export const createJob = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        createdBy: v.id("users"),
        boardId: v.optional(v.id("boards")),
        model: v.string(),
        prompt: v.string(),
        inputAssetIds: v.array(v.id("assets")),
        priority: v.number(),
        costCredits: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const jobId = await ctx.db.insert("generationJobs", {
            workspaceId: args.workspaceId,
            createdBy: args.createdBy,
            boardId: args.boardId,
            status: "queued",
            priority: args.priority,
            model: args.model,
            prompt: args.prompt,
            inputAssetIds: args.inputAssetIds,
            costCredits: args.costCredits,
            createdAt: now,
            updatedAt: now,
        });

        return { jobId };
    },
});

/**
 * Mark job as processing with provider task ID
 */
export const updateJobProcessing = mutation({
    args: {
        jobId: v.id("generationJobs"),
        provider: v.string(),
        providerTaskId: v.string(),
    },
    handler: async (ctx, args) => {
        const job = await ctx.db.get(args.jobId);
        if (!job) {
            return { success: false, error: "Job not found" };
        }

        await ctx.db.patch(args.jobId, {
            status: "processing",
            provider: args.provider,
            providerTaskId: args.providerTaskId,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Mark job as successful with result asset
 */
export const updateJobSuccess = mutation({
    args: {
        jobId: v.id("generationJobs"),
        resultAssetId: v.id("assets"),
    },
    handler: async (ctx, args) => {
        const job = await ctx.db.get(args.jobId);
        if (!job) {
            return { success: false, error: "Job not found" };
        }

        await ctx.db.patch(args.jobId, {
            status: "success",
            resultAssetId: args.resultAssetId,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Mark job as successful with image URL (for Gemini which returns immediately)
 * Stores the image URL directly - frontend will handle displaying it
 */
export const updateJobSuccessWithImageUrl = mutation({
    args: {
        jobId: v.string(), // String because it comes from worker as string
        imageUrl: v.string(),
    },
    handler: async (ctx, args) => {
        // Find job by string ID
        const jobs = await ctx.db
            .query("generationJobs")
            .filter((q) => q.eq(q.field("_id"), args.jobId as any))
            .first();

        if (!jobs) {
            return { success: false, error: "Job not found" };
        }

        await ctx.db.patch(jobs._id, {
            status: "success",
            // Store imageUrl in a new field or use resultImageUrl
            resultImageUrl: args.imageUrl,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Mark job as failed with error message
 */
export const updateJobFailed = mutation({
    args: {
        jobId: v.id("generationJobs"),
        error: v.string(),
    },
    handler: async (ctx, args) => {
        const job = await ctx.db.get(args.jobId);
        if (!job) {
            return { success: false, error: "Job not found" };
        }

        await ctx.db.patch(args.jobId, {
            status: "failed",
            error: args.error,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Get job by ID
 */
export const getJob = query({
    args: {
        jobId: v.id("generationJobs"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.jobId);
    },
});

/**
 * Get multiple jobs by IDs (for batch status watching)
 */
export const getJobsByIds = query({
    args: {
        jobIds: v.array(v.id("generationJobs")),
    },
    handler: async (ctx, args) => {
        const jobs = await Promise.all(
            args.jobIds.map(async (id) => {
                return await ctx.db.get(id);
            })
        );
        return jobs.filter((job): job is NonNullable<typeof job> => job !== null);
    },
});

/**
 * Get job by provider task ID (for callback lookup)
 */
export const getJobByProviderTaskId = query({
    args: {
        providerTaskId: v.string(),
    },
    handler: async (ctx, args) => {
        // Note: For production, add an index on providerTaskId
        const jobs = await ctx.db
            .query("generationJobs")
            .filter((q) => q.eq(q.field("providerTaskId"), args.providerTaskId))
            .first();

        return jobs;
    },
});

/**
 * List jobs for a workspace
 */
export const listJobsForWorkspace = query({
    args: {
        workspaceId: v.id("workspaces"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        const jobs = await ctx.db
            .query("generationJobs")
            .withIndex("by_workspaceId_createdAt", (q) =>
                q.eq("workspaceId", args.workspaceId)
            )
            .order("desc")
            .take(limit);

        return jobs;
    },
});

/**
 * Create an asset from generated image
 */
export const createAssetFromGeneration = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        ownerUserId: v.id("users"),
        title: v.optional(v.string()),
        r2Key: v.string(),
        url: v.string(),
        mimeType: v.string(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        sourceBoardId: v.optional(v.id("boards")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const assetId = await ctx.db.insert("assets", {
            workspaceId: args.workspaceId,
            ownerUserId: args.ownerUserId,
            scope: "personal",
            type: "generated",
            title: args.title,
            tags: [],
            storageProvider: "r2",
            r2Key: args.r2Key,
            url: args.url,
            mimeType: args.mimeType,
            width: args.width,
            height: args.height,
            sourceBoardId: args.sourceBoardId,
            createdAt: now,
            updatedAt: now,
        });

        return { assetId };
    },
});
