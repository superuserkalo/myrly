import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { getSession } from "@/lib/auth";

// Initialize clients
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Queue keys - Priority based
const QUEUE_HIGH = "queue:high";  // Pro, Team, Enterprise
const QUEUE_LOW = "queue:low";    // Free tier

// Worker URL (Cloudflare Worker)
const WORKER_URL = process.env.QUEUE_WORKER_URL!;

export interface QueueJobPayload {
    jobId: string;
    workspaceId: string;
    prompt: string;
    model: string;
    inputImageUrls: string[];
    priority: number;
    createdAt: number;
}

interface GenerateRequest {
    workspaceId?: string;  // Optional - uses default workspace if not provided
    boardId?: string;
    model: string;
    prompt: string;
    inputAssetIds?: string[];
    inputImageUrls?: string[];
    variations: number;  // How many to generate (1-5)
    priority?: number;
    costCredits?: number;
    placeholderIds?: string[];  // Frontend placeholder IDs to track
}

export async function POST(request: NextRequest) {
    try {
        // 1. Validate auth
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse request
        const body: GenerateRequest = await request.json();

        if (!body.model || !body.prompt) {
            return NextResponse.json(
                { error: "Missing required fields: model, prompt" },
                { status: 400 }
            );
        }

        const variations = Math.min(Math.max(body.variations || 1, 1), 5);
        const costCredits = body.costCredits ?? 100;

        // 3. Get user from Convex by auth
        const user = await convex.query(api.users.getUserByAuth, {
            authProvider: "workos",
            authUserId: session.user.id,
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found in database" },
                { status: 404 }
            );
        }

        // Use provided workspaceId or user's default
        const workspaceId = body.workspaceId || user.defaultWorkspaceId;
        if (!workspaceId) {
            return NextResponse.json(
                { error: "No workspace available" },
                { status: 400 }
            );
        }

        // Determine priority based on user plan
        // High priority: pro, team, enterprise
        // Low priority: free (or undefined)
        const userPlan = (user as any).subscriptionPlan || "free";
        const isHighPriority = ["pro", "team", "enterprise"].includes(userPlan.toLowerCase());
        const queueKey = isHighPriority ? QUEUE_HIGH : QUEUE_LOW;
        const priority = isHighPriority ? 10 : 0;

        // 4. Create jobs in Convex
        const jobIds: string[] = [];
        const payloads: QueueJobPayload[] = [];

        for (let i = 0; i < variations; i++) {
            const result = await convex.mutation(api.generation.createJob, {
                workspaceId: workspaceId as any,
                createdBy: user._id,
                boardId: body.boardId as any,
                model: body.model,
                prompt: body.prompt,
                inputAssetIds: (body.inputAssetIds || []) as any[],
                priority,
                costCredits,
            });

            jobIds.push(result.jobId);

            payloads.push({
                jobId: result.jobId,
                workspaceId: workspaceId,
                prompt: body.prompt,
                model: body.model,
                inputImageUrls: body.inputImageUrls || [],
                priority,
                createdAt: Date.now(),
            });
        }

        // 5. Push all jobs to appropriate priority queue
        const pipeline = redis.pipeline();
        for (const payload of payloads) {
            pipeline.rpush(queueKey, JSON.stringify(payload));
        }
        await pipeline.exec();

        console.log(`[Queue] Pushed ${variations} jobs to ${queueKey}:`, jobIds);

        // 6. Fire-and-forget trigger to Cloudflare Worker
        if (WORKER_URL) {
            fetch(WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trigger: "new_jobs", count: variations }),
            }).catch((err) => {
                console.error("[Queue] Failed to trigger worker:", err);
            });
        }

        // 7. Return job IDs
        return NextResponse.json({
            success: true,
            jobIds,
            message: `Queued ${variations} generation job(s)`,
        });

    } catch (error) {
        console.error("[Queue] Generate error:", error);
        return NextResponse.json(
            { error: "Failed to queue generation jobs" },
            { status: 500 }
        );
    }
}
