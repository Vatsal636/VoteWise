import { NextResponse } from "next/server";
import { getElectionAdvice } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { query, profile } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const advice = await getElectionAdvice(query, profile || {});
    return NextResponse.json(advice);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate advice" },
      { status: 500 }
    );
  }
}
