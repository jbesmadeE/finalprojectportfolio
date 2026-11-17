import { z } from "zod";

export const seoRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    }, "Must be a valid https:// URL."),
});

export const seoCheckSchema = z.object({
  name: z.string(),
  status: z.enum(["pass", "warn", "fail"]),
  detail: z.string(),
});

export const seoResponseSchema = z.object({
  mode: z.enum(["real", "mock"]),
  report: z.object({
    url: z.string(),
    score: z.number().min(0).max(100),
    summary: z.string(),
    checks: z.array(seoCheckSchema),
  }),
});

export type SeoRequest = z.infer<typeof seoRequestSchema>;
export type SeoResponse = z.infer<typeof seoResponseSchema>;
