import { getImageProvider } from "@/lib/providers";
import type { ImageRequest, ImageResponse } from "@/lib/schemas/image";

export async function runImageAgent(
  request: ImageRequest,
): Promise<ImageResponse> {
  const { mode, provider } = getImageProvider();
  const image = await provider.generate({
    prompt: request.prompt,
    size: request.size,
    style: request.style ?? undefined,
  });
  return { mode, image };
}
