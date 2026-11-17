/**
 * Video generation provider adapter — asynchronous job pattern.
 * POST creates a job; GET ?id= polls it (mirrors the Stage 4 route design).
 *
 * Real mode: Magic Hour Text-to-Video API.
 * Mock mode: in-memory jobs that advance over time for offline/demo use.
 */
import "server-only";

import {
  magicHourConfig,
  magicHourConfigured,
  providerMode,
  type ProviderMode,
} from "@/lib/env";

export type VideoJobStatus = "queued" | "processing" | "succeeded" | "failed";

export type VideoJob = {
  id: string;
  status: VideoJobStatus;
  videoUrl?: string;
  error?: string;
};

export interface VideoProvider {
  createJob(input: {
    prompt: string;
    durationSeconds?: number;
  }): Promise<{ id: string }>;
  getJob(id: string): Promise<VideoJob>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback;
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (isRecord(first) && typeof first.message === "string" && first.message.trim()) {
      return first.message;
    }
    if (typeof first === "string" && first.trim()) return first;
  }
  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }
  return fallback;
}

class MagicHourTextToVideoProvider implements VideoProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async createJob(input: {
    prompt: string;
    durationSeconds?: number;
  }): Promise<{ id: string }> {
    // Enforce 5s output for this workspace.
    const endSeconds = 5;

    const body: Record<string, unknown> = {
      end_seconds: endSeconds,
      style: { prompt: input.prompt.trim() },
      model: magicHourConfig.textToVideoModel,
      resolution: magicHourConfig.textToVideoResolution,
      aspect_ratio: magicHourConfig.textToVideoAspectRatio,
    };

    if (magicHourConfig.textToVideoAudio) {
      body.audio = true;
    }

    const response = await fetch(`${this.baseUrl}/v1/text-to-video`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      cache: "no-store",
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(
        extractErrorMessage(
          payload,
          `Magic Hour request failed (${response.status}).`,
        ),
      );
    }

    const id =
      isRecord(payload) && typeof payload.id === "string" ? payload.id : null;
    if (!id) {
      throw new Error("Magic Hour did not return a project id.");
    }

    return { id };
  }

  async getJob(id: string): Promise<VideoJob> {
    const response = await fetch(
      `${this.baseUrl}/v1/video-projects/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message = extractErrorMessage(
        payload,
        `Could not fetch video status (${response.status}).`,
      );
      // If the project id is unknown/invalid, surface as a failed job state so
      // the polling UI can display the error cleanly.
      if (response.status === 404) {
        return { id, status: "failed", error: message };
      }
      throw new Error(message);
    }

    if (!isRecord(payload)) {
      throw new Error("Unexpected response from Magic Hour.");
    }

    const status = typeof payload.status === "string" ? payload.status : "";
    const creditsCharged =
      typeof payload.credits_charged === "number" ? payload.credits_charged : null;

    if (status === "queued") {
      return { id, status: "queued" };
    }
    if (status === "rendering") {
      return { id, status: "processing" };
    }
    if (status === "complete") {
      let videoUrl: string | undefined;
      if (Array.isArray(payload.downloads) && payload.downloads.length > 0) {
        const first = payload.downloads[0];
        if (isRecord(first) && typeof first.url === "string") {
          videoUrl = first.url;
        }
      }
      if (!videoUrl) {
        return { id, status: "failed", error: "Video completed but no download URL was returned." };
      }
      return { id, status: "succeeded", videoUrl };
    }
    if (status === "error" || status === "canceled" || status === "draft") {
      let error: string | undefined;
      if (isRecord(payload.error)) {
        const msg = payload.error.message;
        if (typeof msg === "string" && msg.trim()) error = msg;
      }
      if (!error && typeof payload.error_message === "string") {
        error = payload.error_message;
      }
      if (!error) {
        error =
          status === "canceled"
            ? "Video generation was canceled."
            : status === "draft"
              ? "Video project is in draft state."
              : "Video generation failed.";
      }
      if (creditsCharged !== null) {
        // keep message concise; credits/refund behavior is handled by provider
      }
      return { id, status: "failed", error };
    }

    // Unknown/in-between status: treat as processing to keep polling.
    return { id, status: "processing" };
  }
}

type MockJob = VideoJob & { createdAt: number; prompt: string };

const mockJobs = new Map<string, MockJob>();

/** Mock lifecycle: queued (0–2s) → processing (2–8s) → succeeded / failed. */
export class MockVideoProvider implements VideoProvider {
  async createJob(input: {
    prompt: string;
    durationSeconds?: number;
  }): Promise<{ id: string }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const id = `mock-video-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    mockJobs.set(id, {
      id,
      status: "queued",
      createdAt: Date.now(),
      prompt: input.prompt,
      videoUrl: undefined,
      error: undefined,
    });
    return { id };
  }

  async getJob(id: string): Promise<VideoJob> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const job = mockJobs.get(id);
    if (!job) {
      return { id, status: "failed", error: "Unknown job id" };
    }

    const elapsed = Date.now() - job.createdAt;
    if (elapsed < 2_000) {
      return { ...job, status: "queued" };
    }
    if (elapsed < 8_000) {
      return { ...job, status: "processing" };
    }
    // ~1 in 5 mock runs fails, to exercise error states.
    if (job.error === undefined && Math.random() < 0.2) {
      job.error = "[mock] Provider returned an error.";
    }
    if (job.error) {
      return { ...job, status: "failed" };
    }
    return {
      ...job,
      status: "succeeded",
      videoUrl: "https://example.com/mock-video.mp4",
    };
  }
}

export function getVideoProvider(): { mode: ProviderMode; provider: VideoProvider } {
  if (magicHourConfigured && magicHourConfig.apiKey) {
    return {
      mode: providerMode(true),
      provider: new MagicHourTextToVideoProvider(
        magicHourConfig.apiKey,
        magicHourConfig.baseUrl,
      ),
    };
  }
  return { mode: providerMode(false), provider: new MockVideoProvider() };
}
