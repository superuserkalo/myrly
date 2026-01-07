/**
 * KIE.ai Provider - For Z-Image, Grok, Qwen, Seedream
 */

import type { Env, QueueJobPayload, SubmitResult } from "../types";
import { KIE_MODEL_MAP } from "../config";

/**
 * Submit job to KIE.ai with callback URL
 * Returns taskId - completion comes via callback
 */
export async function submitToKie(
    job: QueueJobPayload,
    env: Env,
    useBackupKey = false
): Promise<SubmitResult> {
    const apiKey = useBackupKey && env.KIE_API_KEY_BACKUP
        ? env.KIE_API_KEY_BACKUP
        : env.KIE_API_KEY;

    // Map our model name to KIE.ai model name
    const kieModel = KIE_MODEL_MAP[job.model] || job.model;

    // Build input based on model type
    let input: Record<string, unknown>;
    if (job.model === "qwen") {
        input = {
            prompt: job.prompt,
            image_size: "portrait_4_3",
            num_inference_steps: 30,
            guidance_scale: 2.5,
            enable_safety_checker: true,
            output_format: "png",
            acceleration: "none",
        };
    } else if (job.model === "seedream") {
        input = {
            prompt: job.prompt,
            aspect_ratio: "3:4",
            quality: "basic",
        };
    } else {
        // zimage, grok, etc.
        input = {
            prompt: job.prompt,
            aspect_ratio: "3:4",
        };
    }

    try {
        const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: kieModel,
                input,
                callBackUrl: env.CALLBACK_URL,
            }),
        });

        if (response.status === 429 && !useBackupKey && env.KIE_API_KEY_BACKUP) {
            // Rate limited - try backup key
            console.log("[KIE] Rate limited, trying backup key");
            return submitToKie(job, env, true);
        }

        const data = await response.json() as {
            code?: number;
            message?: string;
            data?: { taskId?: string }
        };

        if (data?.code !== 200 || !data?.data?.taskId) {
            return {
                success: false,
                error: data?.message || `KIE API error ${response.status}`
            };
        }

        return { success: true, taskId: data.data.taskId };

    } catch (error) {
        return { success: false, error: String(error) };
    }
}
