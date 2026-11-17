import { runAmazonAgent } from "@/lib/agents/amazon";
import { enforceRateLimit } from "@/lib/rate-limit";
import { amazonRequestSchema } from "@/lib/schemas/amazon";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "amazon", { limit: 10 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = amazonRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    return Response.json(await runAmazonAgent(parsed.data));
  } catch (error) {
    console.error("[amazon] agent failed:", error);
    return Response.json({ error: "Agent failed. Please try again." }, { status: 500 });
  }
}
