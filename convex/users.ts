import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create a user from WorkOS auth
 */
export const getOrCreateUser = mutation({
    args: {
        authProvider: v.string(),
        authUserId: v.string(),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existing = await ctx.db
            .query("users")
            .withIndex("by_auth", (q) =>
                q.eq("authProvider", args.authProvider).eq("authUserId", args.authUserId)
            )
            .first();

        if (existing) {
            return existing;
        }

        // Create new user
        const userId = await ctx.db.insert("users", {
            authProvider: args.authProvider,
            authUserId: args.authUserId,
            email: args.email,
            createdAt: Date.now(),
            onboardingStatus: "not_started",
            onboardingVersion: 1,
        });

        return await ctx.db.get(userId);
    },
});

/**
 * Get user by auth credentials
 */
export const getUserByAuth = query({
    args: {
        authProvider: v.string(),
        authUserId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_auth", (q) =>
                q.eq("authProvider", args.authProvider).eq("authUserId", args.authUserId)
            )
            .first();
    },
});

/**
 * Check if user has completed onboarding
 */
export const checkOnboardingStatus = query({
    args: {
        authProvider: v.string(),
        authUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth", (q) =>
                q.eq("authProvider", args.authProvider).eq("authUserId", args.authUserId)
            )
            .first();

        if (!user) {
            return { exists: false, onboarded: false, workspaceId: null };
        }

        return {
            exists: true,
            onboarded: user.onboardingStatus === "complete",
            workspaceId: user.lastWorkspaceId || user.defaultWorkspaceId || null,
        };
    },
});
