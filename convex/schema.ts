import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * =========================
   * USERS / PROFILES / ONBOARDING
   * =========================
   */

  users: defineTable({
    // WorkOS (or any provider) identity mapping
    authProvider: v.string(), // e.g. "workos"
    authUserId: v.string(),   // WorkOS user id (string)
    email: v.optional(v.string()),
    createdAt: v.number(),

    // App state
    onboardingStatus: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("complete")
    ),
    onboardingVersion: v.number(),

    defaultWorkspaceId: v.optional(v.id("workspaces")),
    lastWorkspaceId: v.optional(v.id("workspaces")),
  })
    .index("by_auth", ["authProvider", "authUserId"])
    .index("by_email", ["email"]),

  // Public-facing profile for community. Keep separate from `users` for safe exposure.
  userProfiles: defineTable({
    userId: v.id("users"),
    handle: v.optional(v.string()), // e.g. "kalog" (unique in code)
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    links: v.array(
      v.object({
        type: v.string(), // "x" | "github" | "website" | ...
        url: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_handle", ["handle"]),

  // Store onboarding answers as versioned JSON so you can evolve questions over time.
  onboardingResponses: defineTable({
    userId: v.id("users"),
    version: v.number(),
    answers: v.any(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  /**
   * =========================
   * WORKSPACES / MEMBERS / INVITES
   * =========================
   */

  workspaces: defineTable({
    type: v.union(v.literal("personal"), v.literal("team")),
    name: v.string(),
    slug: v.optional(v.string()), // optional pretty url
    ownerUserId: v.id("users"),
    createdAt: v.number(),
    settings: v.optional(
      v.object({
        timezone: v.optional(v.string()),
      })
    ),
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_slug", ["slug"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
      v.literal("billing_admin"),
      v.literal("asset_manager")
    ),
    status: v.union(v.literal("active"), v.literal("invited"), v.literal("removed")),
    joinedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_userId_workspaceId", ["userId", "workspaceId"]),

  // Email invites (team onboarding + invites)
  workspaceInvites: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("member"),
      v.literal("billing_admin"),
      v.literal("asset_manager")
    ),
    token: v.string(), // random, unique; used in /invite/:token
    invitedByUserId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked"), v.literal("expired")),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_email", ["email"]),

  /**
   * =========================
   * SUBSCRIPTIONS (TIER/TRIAL/SEATS)
   * =========================
   */

  subscriptions: defineTable({
    workspaceId: v.id("workspaces"),
    tier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("team"),
      v.literal("enterprise")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled")
    ),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),

    // For team: seat-based billing
    seatsPurchased: v.optional(v.number()),

    // Current billing period boundaries (ms epoch)
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),

    provider: v.union(v.literal("none"), v.literal("stripe")),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),

    updatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_workspaceId", ["workspaceId"]),

  /**
   * =========================
   * CREDITS (CACHED BALANCE + EXPIRING GRANTS)
   * =========================
   *
   * Strategy:
   * - Use expiring grants to represent monthly carryover caps:
   *   Free: grants expire in 1 month
   *   Pro: 2 months
   *   Team: 4 months
   * - Refills: expire in 6 months (separate bucket)
   * - Spend order: earliest expiresAt first
   * - Keep cached totals on creditAccounts to avoid scanning history
   */

  creditAccounts: defineTable({
    workspaceId: v.id("workspaces"),

    // Current cycle boundaries (aligned to subscription period)
    cycleStart: v.number(),
    cycleEnd: v.number(),

    // Snapshot parameters for the cycle
    monthlyGrantPerSeat: v.number(),     // e.g. 3000/10000/25000
    carryoverMonths: v.number(),         // 1 / 2 / 4 (team) / (enterprise later)
    seatCountSnapshot: v.number(),       // seats at time of grant

    // Cached balances (unexpired remaining)
    availableCached: v.number(),         // total of all unexpired grants' remaining
    refillCached: v.number(),            // unexpired remaining of refill grants only

    updatedAt: v.number(),
  }).index("by_workspaceId", ["workspaceId"]),

  creditGrants: defineTable({
    creditAccountId: v.id("creditAccounts"),
    kind: v.union(
      v.literal("monthly"),
      v.literal("refill"),
      v.literal("promo"),
      v.literal("manual")
    ),
    amount: v.number(),
    remaining: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
    meta: v.optional(
      v.object({
        tier: v.optional(v.string()), // free|pro|team|enterprise
        seats: v.optional(v.number()),
        periodStart: v.optional(v.number()),
        periodEnd: v.optional(v.number()),
        purchaseId: v.optional(v.string()),
        note: v.optional(v.string()),
      })
    ),
  })
    .index("by_accountId_expiresAt", ["creditAccountId", "expiresAt"])
    .index("by_accountId_kind_expiresAt", ["creditAccountId", "kind", "expiresAt"]),

  // Optional but recommended: audit trail for debugging/disputes
  creditLedger: defineTable({
    creditAccountId: v.id("creditAccounts"),
    type: v.union(v.literal("grant"), v.literal("spend"), v.literal("expire"), v.literal("adjust")),
    bucket: v.union(v.literal("monthly"), v.literal("refill")),
    amount: v.number(), // positive number; interpret by `type`
    createdAt: v.number(),
    jobId: v.optional(v.id("generationJobs")),
    grantId: v.optional(v.id("creditGrants")),
    reason: v.optional(v.string()),
    meta: v.optional(v.any()),
  }).index("by_accountId_createdAt", ["creditAccountId", "createdAt"]),

  // Optional: team pooled wallet + per-member allocations (admin assigns budgets)
  memberCreditBudgets: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),

    enabled: v.boolean(),
    mode: v.union(v.literal("hard"), v.literal("soft")), // hard=enforce, soft=tracking

    cycleStart: v.number(),
    cycleEnd: v.number(),

    monthlyAllowance: v.optional(v.number()), // null/undefined = unlimited
    remaining: v.optional(v.number()),        // used for hard mode

    updatedAt: v.number(),
  })
    .index("by_workspaceId_userId", ["workspaceId", "userId"])
    .index("by_workspaceId", ["workspaceId"]),

  /**
   * =========================
   * DAILY USAGE LIMITS (e.g. bg removals/day)
   * =========================
   */

  dailyUsage: defineTable({
    workspaceId: v.id("workspaces"),
    // store as "YYYY-MM-DD" in your chosen canonical timezone (UTC recommended)
    date: v.string(),
    bgRemoveCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspaceId_date", ["workspaceId", "date"]),

  /**
   * =========================
   * BOARDS / SNAPSHOTS / SHARING
   * =========================
   */

  boards: defineTable({
    workspaceId: v.id("workspaces"),
    createdBy: v.id("users"),

    kind: v.union(v.literal("whiteboard"), v.literal("moodboard"), v.literal("mixboard")),
    title: v.string(),

    visibility: v.union(v.literal("private"), v.literal("workspace"), v.literal("public")),

    // Latest persisted snapshot pointer (store snapshot JSON in R2; keep only key here)
    latestSnapshotKey: v.optional(v.string()), // R2 key
    latestVersion: v.number(),

    lastEditedByUserId: v.optional(v.id("users")),
    lastCheckpointAt: v.optional(v.number()),

    // Lineage
    forkedFromBoardId: v.optional(v.id("boards")),
    forkType: v.optional(v.union(v.literal("remix"), v.literal("duplicate"), v.literal("template"))),

    createdAt: v.number(),
    updatedAt: v.number(),

    // Optional future-proofing for collab backend selection
    collab: v.optional(
      v.object({
        provider: v.union(v.literal("none"), v.literal("excalidraw-room"), v.literal("custom")),
        roomId: v.optional(v.string()),
        roomKey: v.optional(v.string()),
        updatedAt: v.optional(v.number()),
      })
    ),
  })
    .index("by_workspaceId_updatedAt", ["workspaceId", "updatedAt"])
    .index("by_visibility_createdAt", ["visibility", "createdAt"])
    .index("by_forkedFromBoardId", ["forkedFromBoardId"]),

  // Optional history of snapshots (still stored in R2; this table stores pointers/versioning)
  boardSnapshots: defineTable({
    boardId: v.id("boards"),
    version: v.number(),
    r2Key: v.string(),
    checksum: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_boardId_version", ["boardId", "version"])
    .index("by_boardId_createdAt", ["boardId", "createdAt"]),

  // Share links (unlisted/public links with modes)
  boardShares: defineTable({
    boardId: v.id("boards"),
    createdBy: v.id("users"),

    token: v.string(), // /share/:token (opaque random)
    mode: v.union(v.literal("view"), v.literal("remix"), v.literal("edit")),
    status: v.union(v.literal("active"), v.literal("revoked"), v.literal("expired")),

    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    lastAccessedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_boardId", ["boardId"]),

  /**
   * =========================
   * ASSETS (PERSONAL + TEAM) + FOLDERS
   * =========================
   */

  assets: defineTable({
    workspaceId: v.id("workspaces"),
    ownerUserId: v.id("users"),

    // personal = only owner sees; team = workspace; public = community-visible asset
    scope: v.union(v.literal("personal"), v.literal("team"), v.literal("public")),

    type: v.union(
      v.literal("image"),
      v.literal("upload"),
      v.literal("generated"),
      v.literal("excalidraw_snippet"),
      v.literal("component")
    ),

    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.array(v.string()),

    // Storage pointers (you said R2)
    storageProvider: v.union(v.literal("r2"), v.literal("external"), v.literal("convex")),
    r2Key: v.optional(v.string()),
    url: v.optional(v.string()),

    mimeType: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),

    // For excalidraw snippet/component JSON
    data: v.optional(v.any()),

    // Traceability
    sourceBoardId: v.optional(v.id("boards")),

    // Team library workflow (optional)
    approvedAt: v.optional(v.number()),
    approvedByUserId: v.optional(v.id("users")),

    createdAt: v.number(),
    updatedAt: v.number(),

    usedCountCached: v.optional(v.number()),
  })
    .index("by_workspace_scope_createdAt", ["workspaceId", "scope", "createdAt"])
    .index("by_owner_scope_createdAt", ["ownerUserId", "scope", "createdAt"])
    .index("by_workspaceId_createdAt", ["workspaceId", "createdAt"]),

  assetFolders: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    parentFolderId: v.optional(v.id("assetFolders")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_parentFolderId", ["parentFolderId"]),

  assetFolderItems: defineTable({
    folderId: v.id("assetFolders"),
    assetId: v.id("assets"),
    addedBy: v.id("users"),
    addedAt: v.number(),
  })
    .index("by_folderId", ["folderId"])
    .index("by_assetId", ["assetId"]),

  /**
   * =========================
   * GENERATION JOBS (PRIORITY QUEUE) + RESULTS
   * =========================
   */

  generationJobs: defineTable({
    workspaceId: v.id("workspaces"),
    createdBy: v.id("users"),
    boardId: v.optional(v.id("boards")),

    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("success"),
      v.literal("failed")
    ),

    // Free/pro/team priority processing
    priority: v.number(), // e.g. free=0, pro=10, team=20, enterprise=30

    model: v.string(),
    prompt: v.string(),
    inputAssetIds: v.array(v.id("assets")),

    costCredits: v.number(),

    provider: v.optional(v.string()),
    providerTaskId: v.optional(v.string()),

    resultAssetId: v.optional(v.id("assets")),
    error: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status_priority_createdAt", ["status", "priority", "createdAt"])
    .index("by_workspaceId_createdAt", ["workspaceId", "createdAt"])
    .index("by_createdBy_createdAt", ["createdBy", "createdAt"]),

  /**
   * =========================
   * COMMUNITY (PUBLISH / REMIX / LIKE / SAVE)
   * =========================
   */

  publishedBoards: defineTable({
    boardId: v.id("boards"),
    authorUserId: v.id("users"),
    // optional attribution to source workspace (not for permissions)
    workspaceId: v.id("workspaces"),

    title: v.string(),
    description: v.optional(v.string()),
    coverAssetId: v.optional(v.id("assets")),

    // MVP tags for filtering (normalize later if needed)
    tags: v.array(v.string()),

    publishedAt: v.number(),
    updatedAt: v.number(),

    // Cached counters for sorting/trending
    viewsCount: v.number(),
    likesCount: v.number(),
    savesCount: v.number(),
    remixCount: v.number(),
  })
    .index("by_publishedAt", ["publishedAt"])
    .index("by_remixCount", ["remixCount"])
    .index("by_authorUserId", ["authorUserId"]),

  boardRemixes: defineTable({
    sourceBoardId: v.id("boards"),                 // original board
    sourcePublishedBoardId: v.optional(v.id("publishedBoards")), // if remixed from community
    remixedBoardId: v.id("boards"),                // new board instance (new boardId)
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_sourceBoardId", ["sourceBoardId"])
    .index("by_sourcePublishedBoardId", ["sourcePublishedBoardId"])
    .index("by_userId", ["userId"]),

  likes: defineTable({
    userId: v.id("users"),
    publishedBoardId: v.id("publishedBoards"),
    createdAt: v.number(),
  })
    .index("by_publishedBoardId", ["publishedBoardId"])
    .index("by_user_publishedBoardId", ["userId", "publishedBoardId"]),

  saves: defineTable({
    userId: v.id("users"),
    publishedBoardId: v.id("publishedBoards"),
    createdAt: v.number(),
  })
    .index("by_publishedBoardId", ["publishedBoardId"])
    .index("by_user_publishedBoardId", ["userId", "publishedBoardId"]),
});

