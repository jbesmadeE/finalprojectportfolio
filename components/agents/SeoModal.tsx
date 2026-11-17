"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, CircleMinus } from "lucide-react";
import ToolModal from "@/components/ToolModal";
import {
  AgentForm,
  CopyButton,
  DownloadTextButton,
  ErrorState,
  LabeledField,
  SkeletonCards,
  inputClass,
} from "@/components/AgentModalUI";
import { seoResponseSchema, type SeoResponse } from "@/lib/schemas/seo";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: SeoResponse };

const STATUS_ICON = {
  pass: <CircleCheck className="h-4 w-4 shrink-0 text-emerald-400" />,
  warn: <CircleMinus className="h-4 w-4 shrink-0 text-amber-300" />,
  fail: <CircleAlert className="h-4 w-4 shrink-0 text-red-400" />,
} as const;

/** SEO Website Analysis agent modal — url in, scored report out. */
export default function SeoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function run() {
    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/agents/seo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Request failed.");
      }
      const parsed = seoResponseSchema.safeParse(json);
      if (!parsed.success) throw new Error("Unexpected response shape.");
      setStatus({ kind: "done", data: parsed.data });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  const report = status.kind === "done" ? status.data.report : null;
  const reportMode = status.kind === "done" ? status.data.mode : null;
  const reportText = report
    ? `SEO report for ${report.url}\nScore: ${report.score}/100\n\n${report.checks
        .map((check) => `[${check.status.toUpperCase()}] ${check.name}: ${check.detail}`)
        .join("\n")}\n\nSummary: ${report.summary}`
    : "";

  return (
    <ToolModal open={open} onClose={onClose} title="SEO Website Analysis" maxWidth="max-w-xl">
      <AgentForm onSubmit={run} busy={status.kind === "loading"} submitLabel="Analyze">
        <LabeledField label="Page URL (https only)">
          <input
            className={inputClass}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            inputMode="url"
            placeholder="https://example.com"
            required
          />
        </LabeledField>
      </AgentForm>

      {status.kind === "loading" && (
        <div className="mt-4">
          <SkeletonCards count={4} />
        </div>
      )}
      {status.kind === "error" && (
        <div className="mt-4">
          <ErrorState message={status.message} onRetry={run} />
        </div>
      )}

      {report && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-lg font-bold text-accent-strong">
              {report.score}
            </span>
            <p className="text-sm leading-relaxed text-zinc-300">{report.summary}</p>
          </div>

          <ul className="space-y-1.5">
            {report.checks.map((check) => (
              <li
                key={check.name}
                className="flex items-start gap-2 rounded-lg bg-surface-2/50 px-2.5 py-2"
              >
                {STATUS_ICON[check.status]}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200">{check.name}</p>
                  <p className="text-xs text-zinc-500">{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <CopyButton text={reportText} label="Copy report" />
            <DownloadTextButton
              filename="seo-report.txt"
              content={reportText}
              label="Download"
            />
            {reportMode === "mock" && (
              <span className="text-xs text-zinc-600">mock data</span>
            )}
          </div>
        </div>
      )}
    </ToolModal>
  );
}
