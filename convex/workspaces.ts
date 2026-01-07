import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a workspace by ID
 */
export const getById = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.workspaceId);
    },
});

/**
 * Check if a user has access to a workspace.
 * Access is granted if:
 * 1. User is the owner of the workspace
 * 2. User is an active member of the workspace
 */
export const checkAccess = query({
    args: {
        workspaceId: v.id("workspaces"),
        authProvider: v.string(),
        authUserId: v.string(),
    },
    handler: async (ctx, args) => {
        // First get the user by auth credentials
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth", (q) =>
                q.eq("authProvider", args.authProvider).eq("authUserId", args.authUserId)
            )
            .first();

        if (!user) {
            return { hasAccess: false, reason: "user_not_found" };
        }

        // Get the workspace
        const workspace = await ctx.db.get(args.workspaceId);

        if (!workspace) {
            return { hasAccess: false, reason: "workspace_not_found" };
        }

        // Check if user is the owner
        if (workspace.ownerUserId === user._id) {
            return { hasAccess: true, role: "owner", workspace, user };
        }

        // Check if user is an active member
        const membership = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_userId_workspaceId", (q) =>
                q.eq("userId", user._id).eq("workspaceId", args.workspaceId)
            )
            .first();

        if (membership && membership.status === "active") {
            return { hasAccess: true, role: membership.role, workspace, user };
        }

        return { hasAccess: false, reason: "no_access" };
    },
});

/**
 * Get all workspaces for a user (owned + member of)
 */
export const listForUser = query({
    args: {
        authProvider: v.string(),
        authUserId: v.string(),
    },
    handler: async (ctx, args) => {
        // Get the user
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth", (q) =>
                q.eq("authProvider", args.authProvider).eq("authUserId", args.authUserId)
            )
            .first();

        if (!user) {
            return [];
        }

        // Get workspaces owned by user
        const ownedWorkspaces = await ctx.db
            .query("workspaces")
            .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", user._id))
            .collect();

        // Get memberships
        const memberships = await ctx.db
            .query("workspaceMembers")
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), user._id),
                    q.eq(q.field("status"), "active")
                )
            )
            .collect();

        // Get member workspaces
        const memberWorkspaceIds = memberships.map((m) => m.workspaceId);
        const memberWorkspaces = await Promise.all(
            memberWorkspaceIds.map((id) => ctx.db.get(id))
        );

        // Combine and deduplicate
        const allWorkspaces = [...ownedWorkspaces];
        for (const ws of memberWorkspaces) {
            if (ws && !allWorkspaces.some((ow) => ow._id === ws._id)) {
                allWorkspaces.push(ws);
            }
        }

        return allWorkspaces;
    },
});

/**
 * Create a workspace for a user.
 * Called during onboarding or when user creates a new workspace.
 */
export const create = mutation({
    args: {
        authProvider: v.string(),
        authUserId: v.string(),
        name: v.string(),
        type: v.union(v.literal("personal"), v.literal("team")),
    },
    handler: async (ctx, args) => {
        // Get the user
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth", (q) =>
                q.eq("authProvider", args.authProvider).eq("authUserId", args.authUserId)
            )
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        // Create the workspace
        const workspaceId = await ctx.db.insert("workspaces", {
            type: args.type,
            name: args.name,
            ownerUserId: user._id,
            createdAt: Date.now(),
        });

        // Add owner as a member
        await ctx.db.insert("workspaceMembers", {
            workspaceId,
            userId: user._id,
            role: "owner",
            status: "active",
            joinedAt: Date.now(),
        });

        // Set as default workspace if user doesn't have one
        if (!user.defaultWorkspaceId) {
            await ctx.db.patch(user._id, {
                defaultWorkspaceId: workspaceId,
                lastWorkspaceId: workspaceId,
            });
        }

        return await ctx.db.get(workspaceId);
    },
});

/**
 * Delete a workspace and clean up related data.
 * Only the owner can delete a workspace.
 */
export const deleteWorkspace = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        authProvider: v.string(),
        authUserId: v.string(),
    },
    handler: async (ctx, args) => {
        // Get the user
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth", (q) =>
                q.eq("authProvider", args.authProvider).eq("authUserId", args.authUserId)
            )
            .first();

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Get the workspace
        const workspace = await ctx.db.get(args.workspaceId);

        if (!workspace) {
            return { success: false, error: "Workspace not found" };
        }

        // Only owner can delete
        if (workspace.ownerUserId !== user._id) {
            return { success: false, error: "Only the owner can delete this workspace" };
        }

        // Delete workspace members
        const members = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        for (const member of members) {
            await ctx.db.delete(member._id);
        }

        // Delete workspace invites
        const invites = await ctx.db
            .query("workspaceInvites")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        for (const invite of invites) {
            await ctx.db.delete(invite._id);
        }

        // Clear user references to this workspace
        if (user.defaultWorkspaceId === args.workspaceId) {
            await ctx.db.patch(user._id, { defaultWorkspaceId: undefined });
        }
        if (user.lastWorkspaceId === args.workspaceId) {
            await ctx.db.patch(user._id, { lastWorkspaceId: undefined });
        }

        // Delete the workspace
        await ctx.db.delete(args.workspaceId);

        return { success: true };
    },
});
