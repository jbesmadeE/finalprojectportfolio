import { runWalmartAgent } from "@/lib/agents/walmart";
import { enforceRateLimit } from "@/lib/rate-limit";
import { walmartRequestSchema } from "@/lib/schemas/walmart";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "walmart", { limit: 10 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = walmartRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    return Response.json(await runWalmartAgent(parsed.data));
  } catch (error) {
    console.error("[walmart] agent failed:", error);
    return Response.json({ error: "Agent failed. Please try again." }, { status: 500 });
  }
}
