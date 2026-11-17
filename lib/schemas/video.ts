import { z } from "zod";

export const videoCreateRequestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required.").max(1000),
  /** Text-to-video is limited to 5 seconds. */
  durationSeconds: z
    .union([z.literal(5), z.null(), z.undefined()])
    .transform(() => 5),
});

export const videoJobSchema = z.object({
  id: z.string(),
  status: z.enum(["queued", "processing", "succeeded", "failed"]),
  videoUrl: z.string().optional(),
  error: z.string().optional(),
});

export const videoCreateResponseSchema = z.object({
  mode: z.enum(["real", "mock"]),
  jobId: z.string(),
});

export const videoStatusResponseSchema = z.object({
  mode: z.enum(["real", "mock"]),
  job: videoJobSchema,
});

export type VideoCreateRequest = z.infer<typeof videoCreateRequestSchema>;
export type VideoCreateResponse = z.infer<typeof videoCreateResponseSchema>;
export type VideoStatusResponse = z.infer<typeof videoStatusResponseSchema>;
export type VideoJob = z.infer<typeof videoJobSchema>;
