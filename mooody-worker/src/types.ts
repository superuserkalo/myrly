/**
 * Shared types for Mooody Worker
 */

// Environment interface
export interface Env {
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
    KIE_API_KEY: string;
    KIE_API_KEY_BACKUP?: string;
    GEMINI_API_KEY: string;
    CONVEX_URL: string;
    CALLBACK_URL: string;
    WORKER_URL: string;
}

// Job payload from Redis queue
export interface QueueJobPayload {
    jobId: string;
    workspaceId: string;
    prompt: string;
    model: string;
    inputImageUrls: string[];
    priority: number;
    createdAt: number;
}

// Generic result type for provider submissions
export interface SubmitResult {
    success: boolean;
    taskId?: string;     // For async providers (KIE.ai)
    imageUrl?: string;   // For sync providers (Gemini)
    error?: string;
}
