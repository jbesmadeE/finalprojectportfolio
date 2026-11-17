/**
 * SEO Website Analysis agent.
 *
 * SSRF protection is MANDATORY (AGENTS.md):
 * - https:// only
 * - hostname must not be localhost/.local/IP-literal in private ranges
 * - DNS result must not resolve to private/loopback/link-local addresses
 * - response capped at 512 KB, 8s timeout
 *
 * Analysis is rule-based on the fetched HTML (no external API needed); the
 * LLM gateway (when configured) rewrites the summary. Network failures fall
 * back to the mock provider report. SSRF-blocked URLs are rejected with
 * `SeoBlockedError` (route responds 400 — never a mock report).
 */
import { lookup } from "node:dns/promises";
import {
  getSeoProvider,
  getLLMProvider,
  type SeoReport,
  type SeoCheck,
  type ProviderMode,
} from "@/lib/providers";
import { llmConfigured } from "@/lib/env";

export class SeoBlockedError extends Error {}

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 8_000;

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // fe80::/10
  // IPv4-mapped (::ffff:10.0.0.1)
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

function guardUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SeoBlockedError("Not a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new SeoBlockedError("Only https:// URLs are allowed.");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new SeoBlockedError("This host is not allowed.");
  }
  if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
    throw new SeoBlockedError("This host is not allowed.");
  }
  return url;
}

async function guardDns(url: URL): Promise<void> {
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(url.hostname, { all: true });
  } catch {
    throw new SeoBlockedError("Could not resolve this hostname.");
  }
  if (addresses.length === 0) {
    throw new SeoBlockedError("Could not resolve this hostname.");
  }
  for (const { address } of addresses) {
    if (address.includes(":") ? isPrivateIPv6(address) : isPrivateIPv4(address)) {
      throw new SeoBlockedError("This host is not allowed.");
    }
  }
}

async function fetchPage(url: URL): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "JBPortfolioSEOBot/1.0 (+portfolio audit)" },
    });
    if (!response.ok) {
      throw new Error(`Site responded with HTTP ${response.status}.`);
    }
    // Cap the read size — never buffer unbounded responses.
    const reader = response.body?.getReader();
    if (!reader) return "";
    const decoder = new TextDecoder();
    let html = "";
    let bytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) {
        reader.cancel();
        break; // analyze what we have; report notes truncation below
      }
      html += decoder.decode(value, { stream: true });
    }
    return html;
  } finally {
    clearTimeout(timer);
  }
}

function countMatches(html: string, regex: RegExp): number {
  return (html.match(regex) ?? []).length;
}

function analyzeHtml(url: URL, html: string): SeoReport {
  const truncatedNote =
    html.length >= MAX_BYTES ? " (page truncated at 512 KB for analysis)" : "";

  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const metaDescription =
    html.match(
      /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
    )?.[1] ??
    html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i,
    )?.[1] ??
    "";
  const h1Count = countMatches(html, /<h1[\s>]/gi);
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imgsWithoutAlt = imgTags.filter((tag) => !/\balt\s*=/i.test(tag)).length;
  const hasJsonLd = /application\/ld\+json/i.test(html);
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? "";
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);

  const checks: SeoCheck[] = [
    {
      name: "Title tag",
      status: title.length >= 15 && title.length <= 65 ? "pass" : title ? "warn" : "fail",
      detail: title
        ? `"${title.slice(0, 80)}" (${title.length} chars${title.length < 15 || title.length > 65 ? " — aim for 15–65" : ""})`
        : "Missing <title>.",
    },
    {
      name: "Meta description",
      status:
        metaDescription.length >= 70 && metaDescription.length <= 165
          ? "pass"
          : metaDescription
            ? "warn"
            : "fail",
      detail: metaDescription
        ? `${metaDescription.length} chars${metaDescription.length < 70 || metaDescription.length > 165 ? " — aim for 70–165" : ""}`
        : "Missing meta description.",
    },
    {
      name: "H1 count",
      status: h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warn",
      detail: `${h1Count} H1 found — exactly one is ideal.`,
    },
    {
      name: "Image alt text",
      status: imgTags.length === 0 ? "warn" : imgsWithoutAlt === 0 ? "pass" : "fail",
      detail:
        imgTags.length === 0
          ? "No images found."
          : `${imgTags.length - imgsWithoutAlt}/${imgTags.length} images have alt attributes.`,
    },
    {
      name: "Structured data",
      status: hasJsonLd ? "pass" : "fail",
      detail: hasJsonLd
        ? "JSON-LD found — good for AEO."
        : "No JSON-LD; add schema.org markup.",
    },
    {
      name: "Mobile viewport",
      status: hasViewport ? "pass" : "fail",
      detail: hasViewport ? "Viewport meta present." : "Missing viewport meta.",
    },
    {
      name: "Language attribute",
      status: lang ? "pass" : "warn",
      detail: lang ? `lang="${lang}"` : "No lang attribute on <html>.",
    },
    {
      name: "Canonical link",
      status: canonical ? "pass" : "warn",
      detail: canonical ? "Canonical URL present." : "No canonical link.",
    },
  ];

  const weights: Record<string, number> = {
    "Title tag": 15,
    "Meta description": 15,
    "H1 count": 10,
    "Image alt text": 15,
    "Structured data": 15,
    "Mobile viewport": 10,
    "Language attribute": 10,
    "Canonical link": 10,
  };
  const score = Math.round(
    checks.reduce(
      (sum, check) =>
        sum +
        (check.status === "pass" ? weights[check.name] : check.status === "warn" ? weights[check.name] / 2 : 0),
      0,
    ),
  );

  const failures = checks.filter((c) => c.status === "fail").map((c) => c.name);
  const warnings = checks.filter((c) => c.status === "warn").map((c) => c.name);
  const summary = [
    failures.length > 0
      ? `Fix first: ${failures.join(", ")}.`
      : warnings.length > 0
        ? `Solid base — polish: ${warnings.join(", ")}.`
        : "All checks pass. Keep monitoring.",
    truncatedNote,
  ]
    .filter(Boolean)
    .join(" ");

  return { url: url.toString(), score, summary, checks };
}

async function summarizeWithLLM(report: SeoReport): Promise<string> {
  const { provider } = getLLMProvider();
  const raw = await provider.complete({
    system:
      "You are an SEO consultant. Given audit checks, write ONE short punchy sentence (max 25 words) telling the site owner what to fix first. Plain text only.",
    prompt: JSON.stringify(report.checks),
  });
  return raw.trim().replace(/^["']|["']$/g, "").slice(0, 200);
}

export async function runSeoAgent(input: {
  url: string;
}): Promise<{ mode: ProviderMode; report: SeoReport }> {
  const url = guardUrl(input.url);
  await guardDns(url);

  try {
    const html = await fetchPage(url);
    if (!html.trim()) {
      throw new Error("Empty response from site.");
    }
    const report = analyzeHtml(url, html);

    if (llmConfigured) {
      try {
        report.summary = await summarizeWithLLM(report);
      } catch (error) {
        console.error("[seo] LLM summary failed, using rule-based summary:", error);
      }
    }
    return { mode: "real", report };
  } catch (error) {
    if (error instanceof SeoBlockedError) throw error;
    console.error("[seo] fetch failed, falling back to mock report:", error);
    const { provider } = getSeoProvider();
    const report = await provider.analyze({ url: url.toString() });
    return { mode: "mock", report };
  }
}
