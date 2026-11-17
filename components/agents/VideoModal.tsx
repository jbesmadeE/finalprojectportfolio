"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ToolModal from "@/components/ToolModal";
import {
  AgentForm,
  CopyButton,
  ErrorState,
  LabeledField,
  SkeletonCards,
  inputClass,
} from "@/components/AgentModalUI";
import {
  videoCreateResponseSchema,
  videoStatusResponseSchema,
  type VideoJob,
} from "@/lib/schemas/video";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "polling"; jobId: string; job: VideoJob | null }
  | { kind: "error"; message: string }
  | { kind: "done"; job: VideoJob }
  | { kind: "cancelled"; jobId: string };

const POLL_INTERVAL_MS = 2_000;
const TIMEOUT_MS = 5 * 60_000;

/**
 * Video Generator agent modal.
 * POST creates a job → GET ?id= polls every 2s → result video or error.
 * Includes cancel (stops polling) and a 90s overall timeout.
 */
export default function VideoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const pollTimerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const stopTimers = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Stop timers when the modal closes.
  useEffect(() => stopTimers, [stopTimers]);

  const poll = useCallback(
    async (jobId: string) => {
      try {
        const response = await fetch(`/api/agents/video?id=${encodeURIComponent(jobId)}`);
        const json = (await response.json()) as unknown;
        if (!response.ok) {
          throw new Error((json as { error?: string }).error ?? "Polling failed.");
        }
        const parsed = videoStatusResponseSchema.safeParse(json);
        if (!parsed.success) throw new Error("Unexpected response shape.");
        if (cancelledRef.current) return;

        const job = parsed.data.job;
        if (job.status === "succeeded" || job.status === "failed") {
          stopTimers();
          setStatus({ kind: "done", job });
          return;
        }
        setStatus({ kind: "polling", jobId, job });
      } catch (error) {
        stopTimers();
        setStatus({
          kind: "error",
          message: error instanceof Error ? error.message : "Polling failed.",
        });
      }
    },
    [stopTimers],
  );

  async function run() {
    cancelledRef.current = false;
    stopTimers();
    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/agents/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt,
          durationSeconds: 5,
        }),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Request failed.");
      }
      const parsed = videoCreateResponseSchema.safeParse(json);
      if (!parsed.success) throw new Error("Unexpected response shape.");

      const jobId = parsed.data.jobId;
      setStatus({ kind: "polling", jobId, job: null });

      pollTimerRef.current = window.setInterval(() => poll(jobId), POLL_INTERVAL_MS);
      timeoutRef.current = window.setTimeout(() => {
        if (cancelledRef.current) return;
        stopTimers();
        setStatus({
          kind: "error",
          message:
            "Generation is taking longer than expected. You can try again shortly.",
        });
      }, TIMEOUT_MS);
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  function cancel() {
    cancelledRef.current = true;
    stopTimers();
    setStatus((current) =>
      current.kind === "polling"
        ? { kind: "cancelled", jobId: current.jobId }
        : { kind: "idle" },
    );
  }

  const busy = status.kind === "loading" || status.kind === "polling";
  const job =
    status.kind === "done"
      ? status.job
      : status.kind === "polling"
        ? status.job
        : null;

  return (
    <ToolModal open={open} onClose={onClose} title="Video Generator" maxWidth="max-w-xl">
      <AgentForm onSubmit={run} busy={busy} submitLabel="Generate Video">
        <LabeledField label="Prompt">
          <textarea
            className={`${inputClass} min-h-20 resize-none`}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="e.g. slow-motion product spin on a dark pedestal, studio lighting"
            required
            maxLength={1000}
          />
        </LabeledField>
        <div className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Duration
          </span>
          <div className={`${inputClass} flex items-center text-zinc-300`}>
            5 seconds (fixed)
          </div>
        </div>
      </AgentForm>

      <div className="mt-4 border-t border-white/10 pt-3">
        {status.kind === "loading" && <SkeletonCards count={2} />}

        {status.kind === "polling" && (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm text-zinc-400">
              {status.job?.status === "processing" ? "Rendering video…" : "Queued…"}
              <span className="ml-1 text-zinc-600">
                job {status.jobId.slice(0, 18)}…
              </span>
            </p>
            <SkeletonCards count={1} />
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-red-400/50 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Cancel
            </button>
          </div>
        )}

        {status.kind === "cancelled" && (
          <div className="rounded-xl border border-dashed border-white/15 px-4 py-5 text-center text-sm text-zinc-500">
            Polling cancelled — job {status.jobId.slice(0, 18)}… may still finish later.
          </div>
        )}

        {status.kind === "error" && (
          <ErrorState message={status.message} onRetry={run} />
        )}

        {job && (
          <div className="space-y-3">
            {job.status === "failed" ? (
              <ErrorState message={job.error ?? "Generation failed."} onRetry={run} />
            ) : (
              <>
                {job.videoUrl && (
                  <video
                    src={job.videoUrl}
                    controls
                    className="w-full rounded-xl border border-white/10 bg-surface"
                  />
                )}
                <div className="flex items-center gap-2">
                  {job.videoUrl && (
                    <>
                      <a
                        href={job.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-accent-strong underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                      >
                        Open video
                      </a>
                      <CopyButton text={job.videoUrl} label="Copy URL" />
                    </>
                  )}
                  <span className="text-xs text-zinc-600">
                    {job.videoUrl ? "ready" : job.status}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {status.kind === "idle" && (
          <p className="rounded-xl border border-dashed border-white/15 px-4 py-5 text-center text-sm text-zinc-500">
            Describe the video to generate (5s, Text-to-Video). Progress updates every 2 seconds.
          </p>
        )}
      </div>
    </ToolModal>
  );
}
