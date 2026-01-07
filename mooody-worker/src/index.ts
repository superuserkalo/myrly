/**
 * Mooody Worker - Singleton Supervisor for Image Generation Queue
 * 
 * This worker:
 * 1. Acquires a Redis lock to ensure only one supervisor runs
 * 2. Pulls jobs from queue:high (paid) then queue:low (free)
 * 3. Submits jobs to appropriate API (Gemini or KIE.ai)
 * 4. Updates Convex with job status
 * 5. Self-continues if more jobs exist and timeout approaching
 */

import { Redis } from "@upstash/redis/cloudflare";

// Types
import type { Env, QueueJobPayload } from "./types";

// Config
import {
	QUEUE_HIGH,
	QUEUE_LOW,
	QUEUE_PROCESSING,
	SUPERVISOR_LOCK,
	LOCK_TTL_SECONDS,
	JOBS_PER_WINDOW,
	WINDOW_MS,
	MAX_EXECUTION_MS,
} from "./config";

// Providers
import { submitToGemini, submitToKie } from "./providers";

// Convex mutations
import { updateJobProcessing, updateJobSuccess, updateJobFailed } from "./convex";

// Utils
import { sleep, spawnContinuation } from "./utils";


export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const startTime = Date.now();

		console.log("[Supervisor] Starting execution");

		// Initialize Redis
		const redis = new Redis({
			url: env.UPSTASH_REDIS_REST_URL,
			token: env.UPSTASH_REDIS_REST_TOKEN,
		});

		try {
			// 1. Try to acquire lock (singleton pattern)
			const lockAcquired = await redis.set(SUPERVISOR_LOCK, "locked", {
				nx: true,
				ex: LOCK_TTL_SECONDS,
			});

			if (!lockAcquired) {
				console.log("[Supervisor] Lock already held by another instance");
				return new Response(JSON.stringify({
					status: "skipped",
					reason: "lock_held"
				}), {
					headers: { "Content-Type": "application/json" },
				});
			}

			console.log("[Supervisor] Lock acquired, processing jobs");

			// 2. Process jobs until timeout or queue empty
			let processedCount = 0;
			let windowStart = Date.now();
			let windowJobCount = 0;

			while (true) {
				// Check timeout
				const elapsed = Date.now() - startTime;
				if (elapsed > MAX_EXECUTION_MS) {
					console.log("[Supervisor] Approaching timeout, spawning continuation");
					ctx.waitUntil(spawnContinuation(env));
					break;
				}

				// Rate limiting within window
				if (windowJobCount >= JOBS_PER_WINDOW) {
					const windowElapsed = Date.now() - windowStart;
					if (windowElapsed < WINDOW_MS) {
						const waitMs = WINDOW_MS - windowElapsed;
						console.log(`[Supervisor] Rate limit reached, waiting ${waitMs}ms`);
						await sleep(waitMs);
					}
					windowStart = Date.now();
					windowJobCount = 0;
				}

				// 3. Pop job from queues - HIGH PRIORITY FIRST, then LOW
				let jobJson = await redis.lmove(
					QUEUE_HIGH,
					QUEUE_PROCESSING,
					"left",
					"right"
				);

				if (!jobJson) {
					jobJson = await redis.lmove(
						QUEUE_LOW,
						QUEUE_PROCESSING,
						"left",
						"right"
					);
				}

				if (!jobJson) {
					console.log("[Supervisor] Both queues empty, exiting");
					break;
				}

				// 4. Process the job
				try {
					const job: QueueJobPayload = typeof jobJson === "string"
						? JSON.parse(jobJson)
						: jobJson;

					console.log(`[Supervisor] Processing job: ${job.jobId}, model: ${job.model}`);

					// Route based on model - Gemini models vs KIE.ai models
					const isGeminiModel = ["gemini", "nano-banana", "nano-banana-pro"].includes(job.model);
					let result: { success: boolean; taskId?: string; imageUrl?: string; error?: string };

					if (isGeminiModel) {
						result = await submitToGemini(job, env);
					} else {
						result = await submitToKie(job, env);
					}

					if (result.success) {
						if (result.imageUrl) {
							// Gemini returns image directly
							await updateJobSuccess(job.jobId, result.imageUrl, env);
							console.log(`[Supervisor] Job ${job.jobId} completed (Gemini)`);
						} else if (result.taskId) {
							// KIE.ai - callback will handle completion
							await updateJobProcessing(job.jobId, result.taskId, env);
							console.log(`[Supervisor] Job ${job.jobId} submitted, KIE taskId: ${result.taskId}`);
						}

						await redis.lrem(QUEUE_PROCESSING, 1, jobJson);
						processedCount++;
						windowJobCount++;
					} else {
						await updateJobFailed(job.jobId, result.error || "Unknown error", env);
						await redis.lrem(QUEUE_PROCESSING, 1, jobJson);
						console.error(`[Supervisor] Job ${job.jobId} failed: ${result.error}`);
					}

				} catch (jobError) {
					console.error(`[Supervisor] Error processing job:`, jobError);
				}
			}

			// 5. Release lock
			await redis.del(SUPERVISOR_LOCK);
			console.log("[Supervisor] Lock released");

			return new Response(JSON.stringify({
				status: "completed",
				processedCount,
				durationMs: Date.now() - startTime,
			}), {
				headers: { "Content-Type": "application/json" },
			});

		} catch (error) {
			console.error("[Supervisor] Fatal error:", error);

			try {
				await redis.del(SUPERVISOR_LOCK);
			} catch {
				// Ignore cleanup errors
			}

			return new Response(JSON.stringify({
				status: "error",
				error: String(error),
			}), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	},
} satisfies ExportedHandler<Env>;
