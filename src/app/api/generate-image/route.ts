import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type GeminiPart =
  | { text?: string }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const prompt = body?.prompt?.trim();
  const attachments = Array.isArray(body?.attachments)
    ? body.attachments
    : [];
  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 },
    );
  }

  const model =
    process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image-preview";
  const ai = new GoogleGenAI({ apiKey });
  const requestParts: GeminiPart[] = [
    { text: prompt },
    ...attachments
      .filter(
        (attachment: { data?: string; mimeType?: string }) =>
          attachment?.data,
      )
      .map((attachment: { data: string; mimeType?: string }) => ({
        inlineData: {
          data: attachment.data,
          mimeType: attachment.mimeType || "image/png",
        },
      })),
  ];

  let data: any;
  try {
    data = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: requestParts } as any],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "3:4",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Generation failed", details: String(error) },
      { status: 502 },
    );
  }

  const responseParts = data?.candidates?.[0]?.content?.parts ?? [];
  const inlinePart = responseParts.find(
    (part: any) =>
      "inlineData" in part ||
      "inline_data" in part ||
      "data" in (part as any),
  ) as any;

  let base64 =
    inlinePart?.inlineData?.data ?? inlinePart?.inline_data?.data ?? "";
  let mimeType =
    inlinePart?.inlineData?.mimeType ??
    inlinePart?.inline_data?.mimeType ??
    "";

  if (!base64) {
    return NextResponse.json(
      { error: "No image returned from Gemini" },
      { status: 502 },
    );
  }

  const resolvedMime = mimeType || "image/png";
  const imageUrl = `data:${resolvedMime};base64,${base64}`;
  return NextResponse.json({ image: imageUrl });
}
