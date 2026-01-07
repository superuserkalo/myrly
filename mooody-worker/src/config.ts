/**
 * Configuration constants for Mooody Worker
 */

// Queue keys - Priority based
export const QUEUE_HIGH = "queue:high";
export const QUEUE_LOW = "queue:low";
export const QUEUE_PROCESSING = "queue:processing";
export const SUPERVISOR_LOCK = "supervisor_lock";

// Lock settings
export const LOCK_TTL_SECONDS = 60;

// Rate limiting
export const JOBS_PER_WINDOW = 20;
export const WINDOW_MS = 10000;

// Timeout management
export const MAX_EXECUTION_MS = 25000;  // Leave 5s buffer before CF 30s limit

// KIE.ai model mapping
export const KIE_MODEL_MAP: Record<string, string> = {
    "zimage": "z-image",
    "grok": "grok-imagine/text-to-image",
    "qwen": "qwen/text-to-image",
    "seedream": "seedream/4.5-text-to-image",
};
