import { NextRequest, NextResponse } from "next/server";
import { generateImpactSimulation } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { profile, selectedIssues } = await req.json();

    if (!selectedIssues || selectedIssues.length < 2) {
      return NextResponse.json(
        { error: "At least 2 issues are required" },
        { status: 400 }
      );
    }

    const result = await generateImpactSimulation(profile || {}, selectedIssues);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Impact API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate impact simulation" },
      { status: 500 }
    );
  }
}
