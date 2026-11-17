import {
  createVideoJob,
  getVideoJobStatus,
} from "@/lib/agents/video";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  videoCreateRequestSchema,
} from "@/lib/schemas/video";

/** POST creates a generation job. */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "video", { limit: 5 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = videoCreateRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await createVideoJob(parsed.data));
  } catch (error) {
    console.error("[video] create failed:", error);
    return Response.json({ error: "Could not start generation. Please try again." }, { status: 500 });
  }
}

/** GET ?id= polls a job's status. */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "video-poll", { limit: 60 });
  if (limited) return limited;

  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 128) {
    return Response.json({ error: "Missing or invalid job id." }, { status: 400 });
  }

  try {
    return Response.json(await getVideoJobStatus(id));
  } catch (error) {
    console.error("[video] poll failed:", error);
    return Response.json({ error: "Could not check job status." }, { status: 500 });
  }
}
