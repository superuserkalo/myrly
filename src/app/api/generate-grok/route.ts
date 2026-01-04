import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const aspectRatio = body?.aspectRatio || "2:3";

  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt is required" },
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
          model: "grok-imagine/text-to-image",
          input: {
            prompt,
            aspect_ratio: aspectRatio,
          },
        }),
      },
    );
    const createData = await createResponse.json();
    if (createData?.code !== 200 || !createData?.data?.taskId) {
      return NextResponse.json(
        { error: "Failed to create task", details: createData?.message },
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
      { error: "No image returned from Grok" },
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
