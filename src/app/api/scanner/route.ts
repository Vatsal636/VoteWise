import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/gemini";
import { scannerRequestSchema, apiSuccess, apiError } from "@/lib/validation";

/**
 * POST /api/scanner
 *
 * Analyzes a civic document image using Gemini Vision (multimodal AI).
 * Extracts text, identifies missing fields, and generates actionable next steps.
 *
 * @security Validates image type (JPEG/PNG/WebP/GIF) and size (max 10MB) via Zod schema.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scannerRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError("Invalid request", parsed.error),
        { status: 400 }
      );
    }

    const { imageBase64, mimeType, profile } = parsed.data;
    const result = await analyzeDocument(imageBase64, mimeType, profile);
    return NextResponse.json(apiSuccess(result));
  } catch (error) {
    console.error("Scanner API Error:", error);
    return NextResponse.json(
      apiError("Failed to analyze document"),
      { status: 500 }
    );
  }
}
