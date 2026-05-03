import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, profile } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Image data and mimeType are required" },
        { status: 400 }
      );
    }

    const result = await analyzeDocument(imageBase64, mimeType, profile || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error("Scanner API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze document" },
      { status: 500 }
    );
  }
}
