import { NextRequest } from "next/server";
import { streamElectionAdvice } from "@/lib/gemini";
import { Content } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { query, profile, history } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chatHistory: Content[] = (history || []).map(
      (msg: { role: string; text: string }) => ({
        role: msg.role === "assistant" ? "model" : msg.role,
        parts: [{ text: msg.text }],
      })
    );

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamElectionAdvice(
            query,
            profile || {},
            chatHistory
          );

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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
