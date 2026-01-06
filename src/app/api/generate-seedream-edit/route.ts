import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TTL_MS = 10 * 60 * 1000;
const tempImages = new Map<
  string,
  { buffer: Buffer; contentType: string; createdAt: number }
>();

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const cleanupExpired = () => {
  const now = Date.now();
  for (const [token, entry] of tempImages.entries()) {
    if (now - entry.createdAt > TTL_MS) {
      tempImages.delete(token);
    }
  }
};

const parseDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }
  return { contentType: match[1], data: match[2] };
};

const resolveBaseUrl = (request: Request) => {
  const override =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.APP_URL;
  if (override) {
    return override.replace(/\/$/, "");
  }
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) {
    return "";
  }
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
};

const isLocalUrl = (value: string) => {
  if (!value) {
    return true;
  }
  return (
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    value.includes("[::1]") ||
    value.endsWith(".local")
  );
};

export async function HEAD(request: Request) {
  cleanupExpired();
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response(null, { status: 404 });
  }
  const entry = tempImages.get(token);
  if (!entry) {
    return new Response(null, { status: 404 });
  }
  return new Response(null, {
    headers: {
      "Content-Type": entry.contentType,
      "Content-Length": entry.buffer.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  cleanupExpired();
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Not found", { status: 404 });
  }
  const entry = tempImages.get(token);
  if (!entry) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(entry.buffer), {
    headers: {
      "Content-Type": entry.contentType,
      "Content-Length": entry.buffer.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.zimage_api_key || process.env.ZIMAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing zimage_api_key" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const prompt = body?.prompt?.trim();
  const images = Array.isArray(body?.images) ? body.images.slice(0, 1) : [];
  const aspectRatio = body?.aspectRatio || "3:4";
  const quality = body?.quality || "basic";

  if (!prompt || images.length === 0) {
    return NextResponse.json(
      { error: "Prompt and images are required" },
      { status: 400 },
    );
  }

  cleanupExpired();
  const baseUrl = resolveBaseUrl(request);
  const useDirectDataUrl = !baseUrl || isLocalUrl(baseUrl);

  const imageUrls: string[] = [];
  for (const image of images) {
    if (typeof image !== "string" || !image.trim()) {
      continue;
    }
    const trimmed = image.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      imageUrls.push(trimmed);
      continue;
    }
    if (!trimmed.startsWith("data:")) {
      continue;
    }
    const parsed = parseDataUrl(trimmed);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid data URL" },
        { status: 400 },
      );
    }
    if (!allowedContentTypes.has(parsed.contentType)) {
      return NextResponse.json(
        { error: "Unsupported image type" },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(parsed.data, "base64");
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds 10MB limit" },
        { status: 413 },
      );
    }
    if (useDirectDataUrl) {
      imageUrls.push(trimmed);
    } else {
      const token = crypto.randomUUID();
      tempImages.set(token, {
        buffer,
        contentType: parsed.contentType,
        createdAt: Date.now(),
      });
      imageUrls.push(`${baseUrl}/api/generate-seedream-edit?token=${token}`);
    }
  }

  if (imageUrls.length === 0) {
    return NextResponse.json(
      { error: "No valid images provided" },
      { status: 400 },
    );
  }

  let taskId = "";
  try {
    const createResponse = await fetch(
      "https://api.kie.ai/api/v1/jobs/createTask",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "seedream/4.5-edit",
          input: {
            prompt,
            image_urls: imageUrls,
            aspect_ratio: aspectRatio,
            quality,
          },
        }),
      },
    );
    const createData = await createResponse.json();
    if (createData?.code !== 200 || !createData?.data?.taskId) {
      return NextResponse.json(
        {
          error: "Failed to create task",
          details: createData?.message ?? createData?.msg,
        },
        { status: 502 },
      );
    }
    taskId = createData.data.taskId;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task", details: String(error) },
      { status: 502 },
    );
  }

  const maxAttempts = 20;
  let recordData: any = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await sleep(1500);
    try {
      const recordResponse = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );
      recordData = await recordResponse.json();
      if (recordData?.code !== 200) {
        continue;
      }
      const state = recordData?.data?.state;
      if (state === "success") {
        break;
      }
      if (state === "fail") {
        return NextResponse.json(
          {
            error: "Generation failed",
            details: recordData?.data?.failMsg || "Unknown error",
          },
          { status: 502 },
        );
      }
    } catch {
      recordData = null;
    }
  }

  const resultJson = recordData?.data?.resultJson;
  if (!resultJson) {
    return NextResponse.json(
      { error: "Timed out waiting for image" },
      { status: 504 },
    );
  }

  let resultUrl = "";
  try {
    const parsed = JSON.parse(resultJson);
    resultUrl = parsed?.resultUrls?.[0] ?? "";
  } catch {
    resultUrl = "";
  }

  if (!resultUrl) {
    return NextResponse.json(
      { error: "No image returned from Seedream" },
      { status: 502 },
    );
  }

  try {
    const imageResponse = await fetch(resultUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image");
    }
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const base64 = buffer.toString("base64");
    return NextResponse.json({
      image: `data:${contentType};base64,${base64}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to download image", details: String(error) },
      { status: 502 },
    );
  }
}
