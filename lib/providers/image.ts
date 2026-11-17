/**
 * Image generation provider adapter.
 * Real mode uses Cloudflare Workers AI (FLUX.2 klein 9B by default) via REST.
 * Mock mode returns a placeholder so the modal flow can be demoed offline.
 */
import "server-only";

import {
  cloudflareImageConfigured,
  cloudflareImageModel,
  env,
  providerMode,
  type ProviderMode,
} from "@/lib/env";

export type GeneratedImage =
  | { url: string }
  | { base64: string; mimeType: string };

export interface ImageGenerateInput {
  prompt: string;
  /** e.g. "1024x1024" | "1024x1792" | "1792x1024" */
  size: string;
  style?: string;
}

export interface ImageProvider {
  generate(input: ImageGenerateInput): Promise<GeneratedImage>;
}

function parseSize(size: string): { width: number; height: number } {
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) return { width: 1024, height: 1024 };
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return { width: 1024, height: 1024 };
  }
  return { width, height };
}

function withStyle(prompt: string, style?: string): string {
  const base = prompt.trim();
  if (!style) return base;
  const hints: Record<string, string> = {
    photorealistic: "photorealistic, highly detailed, natural lighting",
    illustration: "digital illustration, clean composition, artful",
    logo: "logo design, simple, vector-like, high contrast, centered",
    flat: "flat design, minimal, clean shapes, modern",
  };
  const hint = hints[style] ?? style;
  return `${base}. Style: ${hint}.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractBase64Image(payload: unknown): string | null {
  if (typeof payload === "string" && payload.length > 0) {
    // Sometimes the API may return the base64 string directly.
    return payload;
  }
  if (!isRecord(payload)) return null;

  // Common Workers AI envelope: { result: { image: "<base64>" }, success, ... }
  // or { result: "<base64>" }
  const result = payload.result;
  if (typeof result === "string" && result.length > 0) return result;
  if (isRecord(result)) {
    const img = result.image;
    if (typeof img === "string" && img.length > 0) return img;
    const b64 = result.b64_json ?? result.b64 ?? result.base64;
    if (typeof b64 === "string" && b64.length > 0) return b64;
    // Some responses nest under result.images[0]
    const images = result.images;
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      if (typeof first === "string" && first.length > 0) return first;
      if (isRecord(first)) {
        const nested = first.image ?? first.b64_json ?? first.base64 ?? first.url;
        if (typeof nested === "string" && nested.startsWith("data:")) return nested;
        if (typeof nested === "string" && nested.length > 0) return nested;
      }
    }
  }

  // Direct fields fallback
  const direct = payload.image ?? payload.b64_json ?? payload.base64;
  if (typeof direct === "string" && direct.length > 0) return direct;

  return null;
}

export class CloudflareWorkersAIImageProvider implements ImageProvider {
  async generate(input: ImageGenerateInput): Promise<GeneratedImage> {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
      throw new Error("Cloudflare Workers AI is not configured.");
    }

    const model = cloudflareImageModel;
    const { width, height } = parseSize(input.size);
    const prompt = withStyle(input.prompt, input.style);

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      accountId,
    )}/ai/run/${model}`;

    // This model requires multipart/form-data input (Workers AI REST).
    const form = new FormData();
    form.set("prompt", prompt);
    form.set("width", String(width));
    form.set("height", String(height));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json, image/*",
      },
      body: form,
    });

    const contentType = response.headers.get("content-type") ?? "";

    // Some image endpoints may return binary image bytes directly.
    if (contentType.startsWith("image/")) {
      if (!response.ok) {
        throw new Error(`Image generation failed (${response.status}).`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return { base64: buffer.toString("base64"), mimeType: contentType.split(";")[0] };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error(`Image generation failed (${response.status}).`);
      }
      throw new Error("Unexpected response from image provider.");
    }

    if (!response.ok) {
      const message =
        isRecord(payload) && Array.isArray(payload.errors) && payload.errors.length > 0
          ? String(
              isRecord(payload.errors[0]) && payload.errors[0].message
                ? payload.errors[0].message
                : "Image generation failed.",
            )
          : `Image generation failed (${response.status}).`;
      throw new Error(message);
    }

    if (isRecord(payload) && payload.success === false) {
      const message =
        Array.isArray(payload.errors) && payload.errors.length > 0
          ? String(
              isRecord(payload.errors[0]) && payload.errors[0].message
                ? payload.errors[0].message
                : "Image generation failed.",
            )
          : "Image generation failed.";
      throw new Error(message);
    }

    const image = extractBase64Image(payload);
    if (!image) {
      throw new Error("Image provider returned no image data.");
    }

    // Data URL passthrough
    if (image.startsWith("data:")) {
      const m = /^data:([^;,]+);base64,(.+)$/i.exec(image);
      if (m) {
        return { base64: m[2], mimeType: m[1] };
      }
      return { url: image };
    }

    // URL passthrough (unlikely, but safe)
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return { url: image };
    }

    return { base64: image, mimeType: "image/png" };
  }
}

export class MockImageProvider implements ImageProvider {
  async generate(input: ImageGenerateInput): Promise<GeneratedImage> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#141417"/><text x="256" y="240" fill="#8b5cf6" font-family="sans-serif" font-size="20" text-anchor="middle">mock image</text><text x="256" y="280" fill="#71717a" font-family="sans-serif" font-size="14" text-anchor="middle">${input.prompt
      .slice(0, 40)
      .replace(/[<>&]/g, "")}</text></svg>`;
    return {
      base64: Buffer.from(svg).toString("base64"),
      mimeType: "image/svg+xml",
    };
  }
}

export function getImageProvider(): { mode: ProviderMode; provider: ImageProvider } {
  if (cloudflareImageConfigured) {
    return { mode: providerMode(true), provider: new CloudflareWorkersAIImageProvider() };
  }
  return { mode: providerMode(false), provider: new MockImageProvider() };
}
