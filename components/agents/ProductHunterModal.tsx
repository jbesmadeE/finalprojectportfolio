"use client";

import { useState } from "react";
import ToolModal from "@/components/ToolModal";
import {
  AgentForm,
  CopyButton,
  DownloadTextButton,
  EmptyState,
  ErrorState,
  LabeledField,
  ResultsSection,
  SkeletonCards,
  inputClass,
} from "@/components/AgentModalUI";
import {
  productResponseSchema,
  type ProductRequest,
  type ProductResponse,
} from "@/lib/schemas/product";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: ProductResponse };

function scoreBadgeClass(score: number | null): string {
  if (score === null) return "border-white/10 text-zinc-400";
  if (score >= 75) return "border-accent/60 bg-accent/15 text-accent-strong";
  if (score >= 55) return "border-amber-400/50 bg-amber-400/10 text-amber-300";
  return "border-white/15 bg-white/5 text-zinc-400";
}

/**
 * Shared Product Hunter modal — used by both Walmart and Amazon agents.
 * Form on top (keyword + price range), ranked listings below with
 * opportunity scores, copy, and download.
 */
export default function ProductHunterModal({
  open,
  onClose,
  marketplace,
  title,
}: {
  open: boolean;
  onClose: () => void;
  marketplace: "walmart" | "amazon";
  title: string;
}) {
  const [keyword, setKeyword] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function run() {
    setStatus({ kind: "loading" });
    try {
      const body: ProductRequest = { keyword, minPrice: parsePrice(minPrice), maxPrice: parsePrice(maxPrice) };
      const response = await fetch(`/api/agents/${marketplace}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(
          (json as { error?: string }).error ?? "Request failed.",
        );
      }
      const parsed = productResponseSchema.safeParse(json);
      if (!parsed.success) throw new Error("Unexpected response shape.");
      setStatus({ kind: "done", data: parsed.data });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  const listings = status.kind === "done" ? status.data.listings : [];

  return (
    <ToolModal open={open} onClose={onClose} title={title} maxWidth="max-w-xl">
      <AgentForm onSubmit={run} busy={status.kind === "loading"} submitLabel="Find Products">
        <LabeledField label="Keyword">
          <input
            className={inputClass}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={marketplace === "walmart" ? "e.g. kitchen organizer" : "e.g. led lights"}
            required
            maxLength={120}
          />
        </LabeledField>
        <div className="grid grid-cols-2 gap-3">
          <LabeledField label="Min price (USD)">
            <input
              className={inputClass}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              inputMode="decimal"
              placeholder="optional"
            />
          </LabeledField>
          <LabeledField label="Max price (USD)">
            <input
              className={inputClass}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              inputMode="decimal"
              placeholder="optional"
            />
          </LabeledField>
        </div>
      </AgentForm>

      <ResultsSection>
        {status.kind === "loading" && <SkeletonCards count={4} />}
        {status.kind === "error" && (
          <ErrorState message={status.message} onRetry={run} />
        )}
        {status.kind === "done" && listings.length === 0 && (
          <EmptyState message="No listings matched. Try a broader keyword." />
        )}
        {status.kind === "done" && listings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">
                {status.data.mode === "mock"
                  ? "Mock data — add OPENAI_API_KEY for live results."
                  : "Live results."}
              </p>
              <DownloadTextButton
                label="Export"
                filename={`${marketplace}-results.json`}
                mimeType="application/json"
                content={JSON.stringify(status.data.listings, null, 2)}
              />
            </div>
            {listings.map((listing) => (
              <article
                key={listing.url}
                className="rounded-xl border border-white/10 bg-surface-2/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium leading-snug text-zinc-100">
                    {listing.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreBadgeClass(listing.opportunityScore)}`}
                  >
                    {listing.opportunityScore === null
                      ? "—"
                      : `${listing.opportunityScore}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {listing.price === null
                    ? "Price unavailable"
                    : `$${listing.price.toFixed(2)}`}
                  {listing.rating !== null && ` · ★ ${listing.rating.toFixed(1)}`}
                  {listing.reviewCount !== null &&
                    ` (${listing.reviewCount.toLocaleString()} reviews)`}
                </p>
                {listing.reasons.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {listing.reasons.map((reason) => (
                      <li key={reason} className="text-xs text-zinc-500">
                        — {reason}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent-strong underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                  >
                    View listing
                  </a>
                  <CopyButton
                    label="Copy"
                    text={`${listing.title}\n${listing.url}`}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
        {status.kind === "idle" && (
          <EmptyState message="Enter a keyword to hunt for products." />
        )}
      </ResultsSection>
    </ToolModal>
  );
}

function parsePrice(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
