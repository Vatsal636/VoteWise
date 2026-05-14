import { NextRequest } from "next/server";
import { streamElectionAdvice } from "@/lib/gemini";
import { adviceRequestSchema, apiError } from "@/lib/validation";
import { Content } from "@google/generative-ai";

/**
 * POST /api/advice
 *
 * Streams AI-generated election advice using Server-Sent Events (SSE).
 * Supports multi-turn conversation with full chat history context.
 *
 * @security Validates input with Zod schema before processing.
 * @performance Uses SSE streaming for token-by-token delivery, reducing perceived latency.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adviceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify(apiError("Invalid request", parsed.error)),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { query, profile, history } = parsed.data;

    const chatHistory: Content[] = history.map(
      (msg: { role: string; text: string }) => ({
        role: msg.role === "assistant" ? "model" : msg.role,
        parts: [{ text: msg.text }],
      })
    );

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamElectionAdvice(query, profile, chatHistory);

          for await (const chunk of generator) {
            const payload = JSON.stringify({ text: chunk });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (error) {
          console.error("Stream error:", error);
          const errorPayload = JSON.stringify({
            error: "Failed to generate advice",
          });
          controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify(apiError("Internal server error")),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
