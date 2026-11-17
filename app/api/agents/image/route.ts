import { runImageAgent } from "@/lib/agents/image";
import { enforceRateLimit } from "@/lib/rate-limit";
import { imageRequestSchema } from "@/lib/schemas/image";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "image", { limit: 5 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = imageRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await runImageAgent(parsed.data));
  } catch (error) {
    console.error("[image] agent failed:", error);
    return Response.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
