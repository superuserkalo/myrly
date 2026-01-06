import { mutation } from "./_generated/server";
import { v } from "convex/values";

const onboardingAnswersValidator = v.object({
    purpose: v.union(v.literal("work"), v.literal("school"), v.literal("personal")),
    role: v.string(),
    discoverySource: v.string(),
    referralCode: v.optional(v.string()),
    invitedEmails: v.array(v.string()),
    workspaceName: v.string(),
});

/**
 * Complete onboarding: save responses, create workspace, update user status
 */
export const completeOnboarding = mutation({
    args: {
        authProvider: v.string(),
        authUserId: v.string(),
        answers: onboardingAnswersValidator,
    },
    handler: async (ctx, args) => {
        // Get user
        const user = await ctx.db
            .query("users")
            .withIndex("by_auth", (q) =>
                q.eq("authProvider", args.authProvider).eq("authUserId", args.authUserId)
            )
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        const now = Date.now();

        // Create workspace
        const workspaceId = await ctx.db.insert("workspaces", {
            type: args.answers.purpose === "personal" ? "personal" : "team",
            name: args.answers.workspaceName,
            ownerUserId: user._id,
            createdAt: now,
        });

        // Add user as owner member
        await ctx.db.insert("workspaceMembers", {
            workspaceId,
            userId: user._id,
            role: "owner",
            status: "active",
            joinedAt: now,
        });

        // Create credit account for workspace (free tier)
        const cycleEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now
        await ctx.db.insert("creditAccounts", {
            workspaceId,
            cycleStart: now,
            cycleEnd,
            monthlyGrantPerSeat: 3000, // Free tier
            carryoverMonths: 1,
            seatCountSnapshot: 1,
            availableCached: 3000,
            refillCached: 0,
            updatedAt: now,
        });

        // Create subscription (free tier)
        await ctx.db.insert("subscriptions", {
            workspaceId,
            tier: "free",
            status: "active",
            billingCycle: "monthly",
            currentPeriodStart: now,
            currentPeriodEnd: cycleEnd,
            provider: "none",
            createdAt: now,
            updatedAt: now,
        });

        // Save onboarding responses
        await ctx.db.insert("onboardingResponses", {
            userId: user._id,
            version: 1,
            answers: args.answers,
            startedAt: now,
            completedAt: now,
        });

        // Create profile
        await ctx.db.insert("userProfiles", {
            userId: user._id,
            links: [],
            createdAt: now,
            updatedAt: now,
        });

        // Update user status
        await ctx.db.patch(user._id, {
            onboardingStatus: "complete",
            defaultWorkspaceId: workspaceId,
            lastWorkspaceId: workspaceId,
        });

        // Create workspace invites for invited emails
        for (const email of args.answers.invitedEmails) {
            const token = crypto.randomUUID();
            await ctx.db.insert("workspaceInvites", {
                workspaceId,
                email,
                role: "member",
                token,
                invitedByUserId: user._id,
                status: "pending",
                createdAt: now,
                expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            // TODO: Send invite email
        }

        return { workspaceId };
    },
});

/**
 * Start onboarding (mark as in progress)
 */
export const startOnboarding = mutation({
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
            throw new Error("User not found");
        }

        if (user.onboardingStatus === "not_started") {
            await ctx.db.patch(user._id, {
                onboardingStatus: "in_progress",
            });
        }

        return { userId: user._id };
    },
});
