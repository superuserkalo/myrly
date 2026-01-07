/**
 * Convex API mutations for worker
 */

import type { Env } from "./types";

/**
 * Update job to processing status (job submitted to provider)
 */
export async function updateJobProcessing(
    jobId: string,
    providerTaskId: string,
    env: Env
): Promise<void> {
    const response = await fetch(`${env.CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: "generation:updateJobProcessing",
            args: {
                jobId,
                provider: "kie",
                providerTaskId,
            },
        }),
    });

    if (!response.ok) {
        console.error("[Convex] Failed to update job processing:", await response.text());
    }
}

/**
 * Update job to success status with image URL (for Gemini)
 */
export async function updateJobSuccess(
    jobId: string,
    imageUrl: string,
    env: Env
): Promise<void> {
    const response = await fetch(`${env.CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: "generation:updateJobSuccessWithImageUrl",
            args: { jobId, imageUrl },
        }),
    });

    if (!response.ok) {
        console.error("[Convex] Failed to update job success:", await response.text());
    }
}

/**
 * Update job to failed status
 */
export async function updateJobFailed(
    jobId: string,
    error: string,
    env: Env
): Promise<void> {
    const response = await fetch(`${env.CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: "generation:updateJobFailed",
            args: { jobId, error },
        }),
    });

    if (!response.ok) {
        console.error("[Convex] Failed to update job failed:", await response.text());
    }
}
