/**
 * Gemini Provider - Google's image generation API
 * 
 * Supports two models:
 * - gemini-3-pro-image-preview (Nano Banana Pro) - best quality, 4K, thinking mode
 * - gemini-2.5-flash-image (Nano Banana) - fast, efficient, 1K
 */

import type { Env, QueueJobPayload, SubmitResult } from "../types";

// Model mapping - frontend model name to Google API model name
const GEMINI_MODEL_MAP: Record<string, string> = {
    "gemini": "gemini-3-pro-image-preview",           // Default (Nano Banana Pro)
    "nano-banana-pro": "gemini-3-pro-image-preview",  // Alias
    "nano-banana": "gemini-2.5-flash-image",          // Fast model
};

/**
 * Submit job to Gemini API (Google)
 * Returns image directly since Gemini is synchronous
 */
export async function submitToGemini(
    job: QueueJobPayload,
    env: Env
): Promise<SubmitResult> {
    try {
        // Map model name to Google API model
        const model = GEMINI_MODEL_MAP[job.model] || "gemini-3-pro-image-preview";

        // Build parts: { text } or { inline_data: { mime_type, data } }
        const parts: Array<
            | { text: string }
            | { inline_data: { mime_type: string; data: string } }
        > = [{ text: job.prompt }];

        // Add input images if present (for image editing)
        for (const imageUrl of job.inputImageUrls) {
            if (imageUrl.startsWith("data:")) {
                const [header, data] = imageUrl.split(",");
                const mimeMatch = header.match(/data:([^;]+)/);
                const mimeType = mimeMatch?.[1] || "image/png";
                parts.push({
                    inline_data: { mime_type: mimeType, data }
                });
            }
        }

        // Build request body
        const requestBody: {
            contents: Array<{ role: string; parts: typeof parts }>;
            generationConfig: {
                responseModalities: string[];
                imageConfig?: { aspectRatio?: string; imageSize?: string };
            };
        } = {
            contents: [{ role: "user", parts }],
            generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
                imageConfig: {
                    aspectRatio: "3:4",  // Default portrait aspect ratio
                },
            },
        };

        // For Pro model, can request higher resolution
        if (model === "gemini-3-pro-image-preview") {
            requestBody.generationConfig.imageConfig!.imageSize = "1K";
        }

        // Call Google's REST API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `Gemini API error ${response.status}: ${errorText}` };
        }

        const data = await response.json() as {
            candidates?: Array<{
                content?: {
                    parts?: Array<{
                        text?: string;
                        thought?: boolean;
                        inlineData?: { data: string; mimeType: string };
                        inline_data?: { data: string; mimeType: string };
                    }>;
                };
            }>;
            error?: { message: string };
        };

        if (data.error) {
            return { success: false, error: data.error.message };
        }

        // Find the image part (skip thought images)
        const responseParts = data?.candidates?.[0]?.content?.parts ?? [];
        const imagePart = responseParts.find(
            (p) => !p.thought && (p.inlineData || p.inline_data)
        );

        const base64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
        const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mimeType || "image/png";

        if (!base64) {
            return { success: false, error: "No image returned from Gemini" };
        }

        const imageUrl = `data:${mimeType};base64,${base64}`;
        return { success: true, imageUrl };

    } catch (error) {
        return { success: false, error: String(error) };
    }
}
