import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MS = 10 * 60 * 1000;
const tempImages = new Map<
  string,
  { buffer: Buffer; contentType: string; createdAt: number }
>();

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

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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
  const image = body?.image?.trim();
  if (!image) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  cleanupExpired();
  let imageUrl = image;
  if (image.startsWith("data:")) {
    const parsed = parseDataUrl(image);
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
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds 5MB limit" },
        { status: 413 },
      );
    }
    const token = crypto.randomUUID();
    tempImages.set(token, {
      buffer,
      contentType: parsed.contentType,
      createdAt: Date.now(),
    });
    const baseUrl = resolveBaseUrl(request);
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Unable to resolve base URL" },
        { status: 500 },
      );
    }
    imageUrl = `${baseUrl}/api/remove-background?token=${token}`;
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
          model: "recraft/remove-background",
          input: { image: imageUrl },
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
    await new Promise((resolve) => setTimeout(resolve, 1500));
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
            error: "Background removal failed",
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
      { error: "No image returned from background removal" },
      { status: 502 },
    );
  }

  try {
    const imageResponse = await fetch(resultUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image");
    }
    const contentType =
      imageResponse.headers.get("content-type") || "image/png";
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
