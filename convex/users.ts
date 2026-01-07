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
/**
 * Delete user by auth credentials.
 * Cascade deletes: workspaces owned, memberships, profile, onboarding responses
 */
export const deleteUser = mutation({
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
            return { success: false, error: "User not found" };
        }

        // 1. Delete workspaces owned by user (and all related data)
        const ownedWorkspaces = await ctx.db
            .query("workspaces")
            .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", user._id))
            .collect();

        for (const workspace of ownedWorkspaces) {
            // Delete workspace members
            const members = await ctx.db
                .query("workspaceMembers")
                .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
                .collect();
            for (const member of members) {
                await ctx.db.delete(member._id);
            }

            // Delete workspace invites
            const invites = await ctx.db
                .query("workspaceInvites")
                .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
                .collect();
            for (const invite of invites) {
                await ctx.db.delete(invite._id);
            }

            // Delete subscriptions
            const subscriptions = await ctx.db
                .query("subscriptions")
                .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
                .collect();
            for (const sub of subscriptions) {
                await ctx.db.delete(sub._id);
            }

            // Delete credit accounts
            const creditAccounts = await ctx.db
                .query("creditAccounts")
                .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
                .collect();
            for (const account of creditAccounts) {
                await ctx.db.delete(account._id);
            }

            // Delete the workspace
            await ctx.db.delete(workspace._id);
        }

        // 2. Remove user from any workspaces they're a member of (but don't own)
        const memberships = await ctx.db
            .query("workspaceMembers")
            .filter((q) => q.eq(q.field("userId"), user._id))
            .collect();
        for (const membership of memberships) {
            await ctx.db.delete(membership._id);
        }

        // 3. Delete user profile
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .first();
        if (profile) {
            await ctx.db.delete(profile._id);
        }

        // 4. Delete onboarding responses
        const onboardingResponses = await ctx.db
            .query("onboardingResponses")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();
        for (const response of onboardingResponses) {
            await ctx.db.delete(response._id);
        }

        // 5. Delete the user
        await ctx.db.delete(user._id);

        return { success: true };
    },
});
