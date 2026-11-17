import { getVideoProvider } from "@/lib/providers";
import type {
  VideoCreateRequest,
  VideoCreateResponse,
  VideoStatusResponse,
} from "@/lib/schemas/video";

export async function createVideoJob(
  request: VideoCreateRequest,
): Promise<VideoCreateResponse> {
  const { mode, provider } = getVideoProvider();
  const { id } = await provider.createJob({
    prompt: request.prompt,
    durationSeconds: 5,
  });
  return { mode, jobId: id };
}

export async function getVideoJobStatus(id: string): Promise<VideoStatusResponse> {
  const { mode, provider } = getVideoProvider();
  const job = await provider.getJob(id);
  return { mode, job };
}
