/**
 * Client-side Remotive job search helper.
 *
 * Fetches up to 10 remote jobs for a keyword using Remotive's free, keyless
 * API. Returns a small normalized shape and never throws: any failure
 * (network, non-2xx, malformed payload) resolves to an empty array.
 *
 * No UI, no CSS: this module only fetches and normalizes data.
 */

const REMOTIVE_ENDPOINT = "https://remotive.com/api/remote-jobs";
const MAX_JOBS = 10;
const DEFAULT_QUERY = "developer";

export interface RemotiveJob {
  id: number;
  title: string;
  /** "Rate or salary" text as listed by Remotive ("" when not provided). */
  salary: string;
  /** Remotive's publication/last-edit timestamp for the listing. */
  lastEdit: string;
  category: string;
  /** Remotive `candidate_required_location`. */
  location: string;
  url: string;
}

interface RemotiveApiJob {
  id?: number | string;
  title?: string;
  salary?: string;
  publication_date?: string;
  category?: string;
  candidate_required_location?: string;
  url?: string;
}

interface RemotiveApiResponse {
  jobs?: RemotiveApiJob[];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Searches Remotive for up to 10 remote jobs matching `query`
 * (defaults to "developer" when empty).
 */
export async function searchRemoteJobs(
  query: string = DEFAULT_QUERY,
): Promise<RemotiveJob[]> {
  const keyword =
    typeof query === "string" && query.trim() ? query.trim() : DEFAULT_QUERY;
  const endpoint = `${REMOTIVE_ENDPOINT}?search=${encodeURIComponent(keyword)}&limit=${MAX_JOBS}`;

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as RemotiveApiResponse;
    if (!Array.isArray(data.jobs)) {
      return [];
    }

    const jobs: RemotiveJob[] = [];
    for (const job of data.jobs) {
      const id = Number(job?.id);
      const title = text(job?.title);
      const url = text(job?.url);

      // Skip entries that cannot render as a usable job card.
      if (!Number.isFinite(id) || !title || !url) {
        continue;
      }

      jobs.push({
        id,
        title,
        salary: text(job?.salary),
        lastEdit: text(job?.publication_date),
        category: text(job?.category),
        location: text(job?.candidate_required_location),
        url,
      });

      if (jobs.length === MAX_JOBS) {
        break;
      }
    }

    return jobs;
  } catch {
    return [];
  }
}
