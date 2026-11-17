import { enforceRateLimit } from "@/lib/rate-limit";
import { searchOnlineJobs } from "@/lib/onlinejobs";
import { jobsRequestSchema } from "@/lib/schemas/jobs";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "jobs", { limit: 10 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = jobsRequestSchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const result = await searchOnlineJobs(parsed.data.keyword);
    return Response.json(result);
  } catch (error) {
    console.error("[jobs] OnlineJobs.ph fetch failed:", error);
    return Response.json(
      { error: "Could not fetch jobs right now. Please try again." },
      { status: 502 },
    );
  }
}
