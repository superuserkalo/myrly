/**
 * Utility functions for worker
 */

import type { Env } from "./types";

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Spawn a new worker instance for continuation
 */
export async function spawnContinuation(env: Env): Promise<void> {
    try {
        await fetch(env.WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trigger: "continuation" }),
        });
        console.log("[Supervisor] Continuation spawned");
    } catch (error) {
        console.error("[Supervisor] Failed to spawn continuation:", error);
    }
}
