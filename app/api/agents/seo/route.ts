import { SeoBlockedError, runSeoAgent } from "@/lib/agents/seo";
import { enforceRateLimit } from "@/lib/rate-limit";
import { seoRequestSchema } from "@/lib/schemas/seo";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "seo", { limit: 5 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = seoRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid URL." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await runSeoAgent(parsed.data));
  } catch (error) {
    if (error instanceof SeoBlockedError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("[seo] agent failed:", error);
    return Response.json({ error: "Agent failed. Please try again." }, { status: 500 });
  }
}
