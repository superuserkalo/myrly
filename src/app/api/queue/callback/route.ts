import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// R2 configuration (adjust for your setup)
const R2_BUCKET_URL = process.env.R2_BUCKET_URL;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;

/**
 * KIE.ai callback payload structure
 * Adjust based on actual KIE.ai response format
 */
interface KieCallbackPayload {
    taskId: string;
    status: "success" | "failed" | "processing";
    output?: {
        imageUrl?: string;
        imageUrls?: string[];
    };
    error?: string;
    // Additional fields from KIE
    [key: string]: unknown;
}

/**
 * POST /api/queue/callback
 * Handles callbacks from KIE.ai when image generation completes
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // 1. Basic validation
        const userAgent = request.headers.get("user-agent") || "";

        // Optional: Validate User-Agent or other headers from KIE
        // if (!userAgent.includes("KIE") && process.env.NODE_ENV === "production") {
        //   console.warn("[Callback] Suspicious User-Agent:", userAgent);
        // }

        // 2. Parse payload
        const payload: KieCallbackPayload = await request.json();

        console.log("[Callback] Received:", {
            taskId: payload.taskId,
            status: payload.status,
            hasOutput: !!payload.output,
        });

        if (!payload.taskId) {
            return NextResponse.json(
                { error: "Missing taskId" },
                { status: 400 }
            );
        }

        // 3. Find job by provider task ID
        const job = await convex.query(api.generation.getJobByProviderTaskId, {
            providerTaskId: payload.taskId,
        });

        if (!job) {
            console.error("[Callback] Job not found for taskId:", payload.taskId);
            // Return 200 anyway to prevent KIE from retrying
            return NextResponse.json({
                received: true,
                warning: "Job not found"
            });
        }

        // 4. Handle based on status
        if (payload.status === "failed") {
            await convex.mutation(api.generation.updateJobFailed, {
                jobId: job._id,
                error: payload.error || "Generation failed",
            });

            console.log("[Callback] Job marked failed:", job._id);
            return NextResponse.json({ received: true, status: "failed" });
        }

        if (payload.status === "success" && payload.output) {
            // Get image URL (handle both single and array formats)
            const imageUrl = payload.output.imageUrl || payload.output.imageUrls?.[0];

            if (!imageUrl) {
                await convex.mutation(api.generation.updateJobFailed, {
                    jobId: job._id,
                    error: "No image URL in callback",
                });
                return NextResponse.json({ received: true, status: "no_image" });
            }

            try {
                // 5. Download image (URLs expire in 10 minutes!)
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to download image: ${imageResponse.status}`);
                }

                const imageBuffer = await imageResponse.arrayBuffer();
                const contentType = imageResponse.headers.get("content-type") || "image/png";

                // 6. Upload to R2 (or your storage provider)
                const r2Key = `generated/${job.workspaceId}/${job._id}-${Date.now()}.png`;

                // TODO: Implement your R2 upload logic here
                // For now, we'll use a placeholder URL
                // const uploadedUrl = await uploadToR2(r2Key, imageBuffer, contentType);
                const uploadedUrl = imageUrl; // Temporary: use original URL

                // 7. Create asset in Convex
                const assetResult = await convex.mutation(api.generation.createAssetFromGeneration, {
                    workspaceId: job.workspaceId,
                    ownerUserId: job.createdBy,
                    title: `Generated: ${job.prompt.slice(0, 50)}...`,
                    r2Key,
                    url: uploadedUrl,
                    mimeType: contentType,
                    sourceBoardId: job.boardId,
                });

                // 8. Update job as success
                await convex.mutation(api.generation.updateJobSuccess, {
                    jobId: job._id,
                    resultAssetId: assetResult.assetId,
                });

                console.log("[Callback] Job completed successfully:", job._id, "Asset:", assetResult.assetId);

            } catch (downloadError) {
                console.error("[Callback] Failed to process image:", downloadError);
                await convex.mutation(api.generation.updateJobFailed, {
                    jobId: job._id,
                    error: `Failed to download/save image: ${downloadError}`,
                });
                return NextResponse.json({ received: true, status: "download_failed" });
            }
        }

        // 5. Return 200 quickly (KIE has 15s timeout)
        const processingTime = Date.now() - startTime;
        console.log(`[Callback] Processed in ${processingTime}ms`);

        return NextResponse.json({
            received: true,
            status: "processed",
            processingTimeMs: processingTime,
        });

    } catch (error) {
        console.error("[Callback] Error:", error);
        // Still return 200 to prevent infinite retries
        return NextResponse.json({
            received: true,
            error: "Internal processing error",
        });
    }
}

/**
 * Optional: Handle GET for health checks
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        endpoint: "KIE.ai callback handler",
        timestamp: new Date().toISOString(),
    });
}
