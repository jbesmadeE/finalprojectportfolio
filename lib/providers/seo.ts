/**
 * SEO/AEO analysis provider adapter.
 * The real implementation (Stage 4) fetches the page server-side with strict
 * SSRF protection (https only, block private/loopback/localhost, cap size,
 * 8s timeout) and scores the HTML. Mock mode is the offline fallback.
 */
import { providerMode, type ProviderMode } from "@/lib/env";

export type SeoCheckStatus = "pass" | "warn" | "fail";

export type SeoCheck = {
  name: string;
  status: SeoCheckStatus;
  detail: string;
};

export type SeoReport = {
  url: string;
  /** 0–100. */
  score: number;
  summary: string;
  checks: SeoCheck[];
};

export interface SeoProvider {
  analyze(input: { url: string }): Promise<SeoReport>;
}

const MOCK_CHECKS: SeoCheck[] = [
  { name: "Title tag", status: "pass", detail: "Present, 54 characters" },
  { name: "Meta description", status: "warn", detail: "Missing — add a 150–160 char summary" },
  { name: "H1 count", status: "pass", detail: "Exactly one H1" },
  { name: "Image alt text", status: "fail", detail: "6 of 14 images missing alt attributes" },
  { name: "Structured data", status: "fail", detail: "No JSON-LD found; add Organization + Product schema" },
  { name: "HTTPS", status: "pass", detail: "Served over TLS" },
];

export class MockSeoProvider implements SeoProvider {
  async analyze(input: { url: string }): Promise<SeoReport> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const score = 62;
    return {
      url: input.url,
      score,
      summary: "[mock] Decent fundamentals, but structured data and alt text are costing you.",
      checks: MOCK_CHECKS,
    };
  }
}

export function getSeoProvider(): { mode: ProviderMode; provider: SeoProvider } {
  const mode = providerMode(true);
  void mode;
  return { mode: "mock", provider: new MockSeoProvider() };
}
