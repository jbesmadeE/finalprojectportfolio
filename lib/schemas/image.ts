import { z } from "zod";

export const imageRequestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required.").max(1000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]),
  style: z.enum(["photorealistic", "illustration", "logo", "flat"]).nullish(),
});

export const generatedImageSchema = z.union([
  z.object({ url: z.string() }),
  z.object({ base64: z.string(), mimeType: z.string() }),
]);

export const imageResponseSchema = z.object({
  mode: z.enum(["real", "mock"]),
  image: generatedImageSchema,
});

export type ImageRequest = z.infer<typeof imageRequestSchema>;
export type ImageResponse = z.infer<typeof imageResponseSchema>;
