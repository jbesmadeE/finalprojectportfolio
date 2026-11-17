import { streamText } from "ai";
import { CHAT_SYSTEM_PROMPT, buildMockReply, getChatModel } from "@/lib/agents/chat";
import { enforceRateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/schemas/chat";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "chat", { limit: 20 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid messages." }, { status: 400 });
  }

  const model = getChatModel();
  if (model) {
    try {
      const result = streamText({
        model,
        system: CHAT_SYSTEM_PROMPT,
        messages: parsed.data.messages,
      });
      return result.toTextStreamResponse();
    } catch (error) {
      console.error("[chat] streaming failed:", error);
      return Response.json({ error: "Chat unavailable. Try again." }, { status: 500 });
    }
  }

  // Mock mode: stream the canned reply in chunks so the UI behaves the same.
  const lastUser =
    [...parsed.data.messages].reverse().find((message) => message.role === "user")
      ?.content ?? "";
  const reply = buildMockReply(lastUser);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of reply.match(/[\s\S]{1,24}/g) ?? []) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
