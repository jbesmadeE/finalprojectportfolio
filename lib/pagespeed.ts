/**
 * Client-side Google PageSpeed Insights helper.
 *
 * Fetches a Lighthouse audit for any public URL using the free PageSpeed
 * Insights API (no API key). Anonymous usage shares Google's quota, so calls
 * may occasionally return HTTP 429 — callers should handle `PageSpeedError`.
 *
 * No UI, no CSS: this module only fetches and normalizes data.
 */

const PAGESPEED_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const REQUEST_TIMEOUT_MS = 60_000;

const CATEGORIES = [
  "performance",
  "seo",
  "accessibility",
  "best-practices",
] as const;

/** Scores are whole numbers from 0 to 100 (null when Lighthouse did not score). */
export interface PageSpeedReport {
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  /** Raw Lighthouse numeric values. FCP/LCP are milliseconds; CLS is unitless. */
  metrics: {
    "first-contentful-paint": number | null;
    "largest-contentful-paint": number | null;
    "cumulative-layout-shift": number | null;
  };
}

export type PageSpeedErrorCode =
  | "invalid-url"
  | "rate-limit"
  | "timeout"
  | "network"
  | "api-error"
  | "invalid-response";

export class PageSpeedError extends Error {
  readonly code: PageSpeedErrorCode;

  constructor(code: PageSpeedErrorCode, message: string) {
    super(message);
    this.name = "PageSpeedError";
    this.code = code;
  }
}

interface PsiCategory {
  score?: number | null;
}

interface PsiAudit {
  numericValue?: number;
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: Partial<Record<string, PsiCategory>>;
    audits?: Partial<Record<string, PsiAudit>>;
  };
}

/** Prepends https:// when missing and rejects non-web URLs. */
function normalizeInputUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new PageSpeedError("invalid-url", "Please enter a website URL.");
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new PageSpeedError(
      "invalid-url",
      "That does not look like a valid website URL.",
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new PageSpeedError(
      "invalid-url",
      "Only http:// and https:// URLs can be analyzed.",
    );
  }

  if (!parsed.hostname) {
    throw new PageSpeedError(
      "invalid-url",
      "That does not look like a valid website URL.",
    );
  }

  return parsed.toString();
}

/** Converts a Lighthouse 0–1 score into a rounded 0–100 value. */
function toScore(category: PsiCategory | undefined): number | null {
  const score = category?.score;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }
  return Math.min(100, Math.max(0, Math.round(score * 100)));
}

/** Reads a Lighthouse audit's numeric value, keeping 0 as a valid result. */
function toMetric(audit: PsiAudit | undefined): number | null {
  return typeof audit?.numericValue === "number" &&
    Number.isFinite(audit.numericValue)
    ? audit.numericValue
    : null;
}

/**
 * Runs a PageSpeed Insights audit for `url` and returns normalized scores
 * plus the three core metrics. Throws `PageSpeedError` on invalid URLs,
 * rate limits, timeouts, and malformed API responses.
 */
export async function getPageSpeedReport(url: string): Promise<PageSpeedReport> {
  const normalizedUrl = normalizeInputUrl(url);

  const endpoint = new URL(PAGESPEED_ENDPOINT);
  endpoint.searchParams.set("url", normalizedUrl);
  for (const category of CATEGORIES) {
    endpoint.searchParams.append("category", category);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(endpoint.toString(), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new PageSpeedError(
          "timeout",
          "PageSpeed Insights took too long to respond. Please try again.",
        );
      }
      throw new PageSpeedError(
        "network",
        "Could not reach PageSpeed Insights. Check your connection and try again.",
      );
    }

    if (response.status === 429) {
      throw new PageSpeedError(
        "rate-limit",
        "PageSpeed Insights is rate-limiting requests right now. Please wait a minute and try again.",
      );
    }

    if (!response.ok) {
      let apiMessage = "";
      try {
        const errorBody = (await response.json()) as {
          error?: { message?: string };
        };
        apiMessage = errorBody.error?.message ?? "";
      } catch {
        // The error response was not JSON; use the generic message below.
      }

      throw new PageSpeedError(
        response.status === 400 ? "invalid-url" : "api-error",
        apiMessage || `PageSpeed Insights returned HTTP ${response.status}.`,
      );
    }

    let data: PsiResponse;
    try {
      data = (await response.json()) as PsiResponse;
    } catch {
      throw new PageSpeedError(
        "invalid-response",
        "PageSpeed Insights returned a response that could not be read.",
      );
    }

    const lighthouse = data.lighthouseResult;
    if (!lighthouse?.categories) {
      throw new PageSpeedError(
        "invalid-response",
        "PageSpeed Insights returned an unexpected response.",
      );
    }

    const categories = lighthouse.categories;
    const audits = lighthouse.audits ?? {};

    return {
      performance: toScore(categories.performance),
      seo: toScore(categories.seo),
      accessibility: toScore(categories.accessibility),
      bestPractices: toScore(categories["best-practices"]),
      metrics: {
        "first-contentful-paint": toMetric(
          audits["first-contentful-paint"],
        ),
        "largest-contentful-paint": toMetric(
          audits["largest-contentful-paint"],
        ),
        "cumulative-layout-shift": toMetric(
          audits["cumulative-layout-shift"],
        ),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
