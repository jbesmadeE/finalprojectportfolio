/**
 * Server-only environment access. Import this ONLY from server code
 * (route handlers, server components, agent libs). It is guarded so an
 * accidental client import fails loudly instead of leaking secrets.
 *
 * All values are optional: every agent must run in mock mode when its
 * credentials are missing (Stage 4 rule).
 */
if (typeof window !== "undefined") {
  throw new Error(
    "lib/env.ts is server-only — do not import it from client components.",
  );
}

import { z } from "zod";

/** Treat "" as "not set" so half-filled .env files don't half-configure agents. */
const optionalSecret = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const envSchema = z.object({
  /** OpenAI-compatible LLM gateway (used by most agents + the chatbot). */
  OPENAI_API_KEY: optionalSecret,
  OPENAI_BASE_URL: optionalSecret,
  OPENAI_MODEL: optionalSecret,
  /** Cloudflare Workers AI (image generation). */
  CLOUDFLARE_ACCOUNT_ID: optionalSecret,
  CLOUDFLARE_API_TOKEN: optionalSecret,
  /** Optional: defaults to @cf/black-forest-labs/flux-2-klein-9b. */
  CLOUDFLARE_AI_IMAGE_MODEL: optionalSecret,
  /** Generic image generation provider key (legacy/fallback). */
  IMAGE_API_KEY: optionalSecret,
  /** Magic Hour (video generation, Text-to-Video). */
  MAGIC_HOUR_API_KEY: optionalSecret,
  MAGIC_HOUR_API_BASE_URL: optionalSecret,
  MAGIC_HOUR_TEXT_TO_VIDEO_MODEL: optionalSecret,
  MAGIC_HOUR_TEXT_TO_VIDEO_RESOLUTION: optionalSecret,
  MAGIC_HOUR_TEXT_TO_VIDEO_ASPECT_RATIO: optionalSecret,
  MAGIC_HOUR_TEXT_TO_VIDEO_AUDIO: optionalSecret,
  /** Generic video generation provider key (legacy/fallback). */
  VIDEO_API_KEY: optionalSecret,
  /** Job listings provider. */
  JOBS_API_KEY: optionalSecret,
});

export const env = envSchema.parse(process.env);

export type ProviderMode = "real" | "mock";

/** Agents fall back to mock mode whenever their credential is missing. */
export function providerMode(configured: boolean): ProviderMode {
  return configured ? "real" : "mock";
}

export const llmConfigured = Boolean(env.OPENAI_API_KEY);
export const cloudflareImageConfigured = Boolean(
  env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN,
);
export const magicHourConfigured = Boolean(env.MAGIC_HOUR_API_KEY);

export const magicHourConfig = {
  apiKey: env.MAGIC_HOUR_API_KEY,
  baseUrl: env.MAGIC_HOUR_API_BASE_URL ?? "https://api.magichour.ai",
  textToVideoModel: env.MAGIC_HOUR_TEXT_TO_VIDEO_MODEL ?? "ltx-2.5",
  textToVideoResolution: env.MAGIC_HOUR_TEXT_TO_VIDEO_RESOLUTION ?? "480p",
  textToVideoAspectRatio: env.MAGIC_HOUR_TEXT_TO_VIDEO_ASPECT_RATIO ?? "16:9",
  textToVideoAudio:
    env.MAGIC_HOUR_TEXT_TO_VIDEO_AUDIO?.toLowerCase() === "true",
};

export const cloudflareImageModel =
  env.CLOUDFLARE_AI_IMAGE_MODEL ?? "@cf/black-forest-labs/flux-2-klein-9b";
