"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import ToolModal from "@/components/ToolModal";
import {
  AgentForm,
  EmptyState,
  ErrorState,
  LabeledField,
  ResultsSection,
  SkeletonCards,
  inputClass,
} from "@/components/AgentModalUI";
import {
  jobsResponseSchema,
  type JobsResponse,
} from "@/lib/schemas/jobs";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: JobsResponse };

function formatPosted(postedAt: string | null): string | null {
  if (!postedAt) return null;
  // Values come as "YYYY-MM-DD HH:MM:SS" (PH time from source)
  const m = postedAt.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : postedAt;
}

export default function JobsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function run() {
    const q = keyword.trim();
    if (!q) return;

    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/agents/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: q }),
      });

      const json = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(
          (json as { error?: string }).error ?? "Request failed.",
        );
      }

      const parsed = jobsResponseSchema.safeParse(json);
      if (!parsed.success) throw new Error("Unexpected response from server.");

      setStatus({ kind: "done", data: parsed.data });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  const listings = status.kind === "done" ? status.data.listings : [];

  return (
    <ToolModal open={open} onClose={onClose} title="Job Hunter" maxWidth="max-w-2xl">
      <AgentForm
        onSubmit={run}
        busy={status.kind === "loading"}
        submitLabel="Search OnlineJobs.ph"
      >
        <LabeledField label="Keyword">
          <input
            className={inputClass}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="e.g. virtual assistant, graphic designer"
            required
            maxLength={120}
          />
        </LabeledField>
      </AgentForm>

      <ResultsSection>
        {status.kind === "loading" && <SkeletonCards count={5} />}

        {status.kind === "error" && (
          <ErrorState message={status.message} onRetry={run} />
        )}

        {status.kind === "done" && listings.length === 0 && (
          <EmptyState message={`No jobs found for “${status.data.keyword}”. Try a different keyword.`} />
        )}

        {status.kind === "done" && listings.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Showing {listings.length}
              {status.data.total != null ? ` of ${status.data.total}` : ""} jobs
              from OnlineJobs.ph for “{status.data.keyword}”.
            </p>
            {listings.map((listing) => (
              <article
                key={listing.url}
                className="rounded-xl border border-white/10 bg-surface-2/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-100">
                    {listing.title}
                  </h3>
                  {listing.jobType && (
                    <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                      {listing.jobType}
                    </span>
                  )}
                </div>

                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-zinc-500">Author</dt>
                  <dd className="text-zinc-300">
                    {listing.author ?? "Not listed"}
                  </dd>
                  <dt className="text-zinc-500">Rate</dt>
                  <dd className="font-medium text-accent-strong">{listing.rate}</dd>
                  {formatPosted(listing.postedAt) && (
                    <>
                      <dt className="text-zinc-500">Posted</dt>
                      <dd className="text-zinc-400">
                        {formatPosted(listing.postedAt)}
                      </dd>
                    </>
                  )}
                </dl>

                {listing.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {listing.categories.slice(0, 4).map((category) => (
                      <span
                        key={category}
                        className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-strong underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                >
                  View job posting
                  <ExternalLink className="h-3 w-3" />
                </a>
              </article>
            ))}
          </div>
        )}

        {status.kind === "idle" && (
          <EmptyState message="Enter a keyword to search OnlineJobs.ph." />
        )}
      </ResultsSection>
    </ToolModal>
  );
}
