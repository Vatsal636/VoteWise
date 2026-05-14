import { NextRequest, NextResponse } from "next/server";
import { generateImpactSimulation } from "@/lib/gemini";
import { impactRequestSchema, apiSuccess, apiError } from "@/lib/validation";

/**
 * POST /api/impact
 *
 * Generates a civic impact simulation comparing voter participation vs non-participation.
 * Uses Gemini's structured JSON output for reliable, parseable responses.
 *
 * @security Validates input with Zod schema; requires at least 2 policy issues.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = impactRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError("Invalid request", parsed.error),
        { status: 400 }
      );
    }

    const { profile, selectedIssues } = parsed.data;
    const result = await generateImpactSimulation(profile, selectedIssues);
    return NextResponse.json(apiSuccess(result));
  } catch (error) {
    console.error("Impact API Error:", error);
    return NextResponse.json(
      apiError("Failed to generate impact simulation"),
      { status: 500 }
    );
  }
}
