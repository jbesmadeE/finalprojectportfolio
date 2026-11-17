import "server-only";

import type { JobListing, JobsResponse } from "@/lib/schemas/jobs";

const SEARCH_URL = "https://www.onlinejobs.ph/jobseekers/jobsearch";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_RESULTS = 20;
const CACHE_TTL_MS = 5 * 60_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

type CacheEntry = { expiresAt: number; value: JobsResponse };

const cache = new Map<string, CacheEntry>();

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    hellip: "…",
    rsquo: "'",
    lsquo: "'",
    rdquo: '"',
    ldquo: '"',
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => {
      const n = Number.parseInt(code, 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    })
    .replace(/&([a-z]+);/gi, (full, name: string) => named[name.toLowerCase()] ?? full)
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
}

function extractTotal(html: string): number | null {
  const m = html.match(/Displaying\s+\d+\s+out of\s+(\d+)/i);
  if (m) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }
  const j = html.match(/"search_result_count"\s*:\s*(\d+)/);
  if (j) {
    const n = Number(j[1]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseListing(block: string): JobListing | null {
  const hrefMatch = block.match(/href="(\/jobseekers\/job\/[^"]+)"/i);
  const titleMatch = block.match(/<h4[^>]*class="[^"]*fs-16[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
  if (!hrefMatch || !titleMatch) return null;

  const relativeUrl = hrefMatch[1];
  const url = `https://www.onlinejobs.ph${relativeUrl}`;

  // Title text without badge span
  const titleHtml = titleMatch[1].replace(/<span[\s\S]*?<\/span>/gi, " ");
  const title = stripTags(titleHtml);
  if (!title) return null;

  // Rate: usually in dd after icon-round-dollar, e.g. "Monthly", "$200/Month"
  let rate = "Not specified";
  const rateMatch = block.match(/icon-round-dollar[\s\S]*?<dd[^>]*>([\s\S]*?)<\/dd>/i);
  if (rateMatch) {
    const r = stripTags(rateMatch[1]);
    if (r) rate = r;
  }

  // Posted date
  let postedAt: string | null = null;
  const postedMatch = block.match(/Posted on\s*([^<]+)/i);
  if (postedMatch) {
    const p = stripTags(postedMatch[1]);
    postedAt = p || null;
  }

  // Job type badge (Full Time, Part Time, Gig, Any)
  let jobType: string | null = null;
  const badgeMatch = block.match(/<span[^>]*class="badge[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  if (badgeMatch) {
    const b = stripTags(badgeMatch[1]);
    jobType = b || null;
  }

  // Employer/company/author from logo alt when present
  let author: string | null = null;
  const logoMatch = block.match(/class="jobpost-cat-box-logo"[^>]*alt="([^"]*)"/i);
  if (logoMatch) {
    const a = decodeEntities(logoMatch[1]).trim();
    author = a.length > 0 ? a : null;
  }

  // Categories/tags
  const categories: string[] = [];
  const tagRe = /class='badge'>([^<]+)<\/a>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRe.exec(block)) !== null) {
    const c = decodeEntities(tagMatch[1]).trim();
    if (c) categories.push(c);
  }

  return { title, author, rate, url, postedAt, jobType, categories };
}

export function parseOnlineJobsSearchHtml(
  html: string,
  keyword: string,
): JobsResponse {
  const listings: JobListing[] = [];
  const blocks = html.split("<!-- Start -->");

  for (let i = 1; i < blocks.length; i++) {
    const endIdx = blocks[i].indexOf("<!-- End -->");
    const block = endIdx >= 0 ? blocks[i].slice(0, endIdx) : blocks[i];
    const listing = parseListing(block);
    if (listing) listings.push(listing);
    if (listings.length >= MAX_RESULTS) break;
  }

  return {
    keyword,
    total: extractTotal(html),
    listings,
  };
}

export async function searchOnlineJobs(keyword: string): Promise<JobsResponse> {
  const q = keyword.trim();
  const cacheKey = q.toLowerCase();
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.value;

  const url = new URL(SEARCH_URL);
  url.searchParams.set("jobkeyword", q);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`OnlineJobs.ph responded with ${res.status}`);
    }

    const html = await res.text();
    const value = parseOnlineJobsSearchHtml(html, q);
    cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, value });
    return value;
  } finally {
    clearTimeout(timeout);
  }
}
