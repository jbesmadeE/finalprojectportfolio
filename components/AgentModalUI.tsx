"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Download, RotateCcw, Search } from "lucide-react";

/**
 * Modal internals pattern for agent modals (Stage 4):
 * form on top → results below, with skeleton / error / empty states and
 * copy/download actions. All agent modals should be assembled from these
 * pieces so behavior and styling stay consistent.
 */

/* ------------------------------------------------------------------ */
/* Form field primitives                                               */
/* ------------------------------------------------------------------ */

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function LabeledField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Form (top half)                                                     */
/* ------------------------------------------------------------------ */

export function AgentForm({
  children,
  onSubmit,
  busy,
  submitLabel,
}: {
  /** Input fields. */
  children: ReactNode;
  onSubmit: () => void;
  busy: boolean;
  submitLabel: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) onSubmit();
      }}
      className="space-y-3"
    >
      {children}
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent-strong transition-all duration-200 hover:border-accent hover:bg-accent/20 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Search className="h-4 w-4" />
        {busy ? "Working…" : submitLabel}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Results (bottom half)                                               */
/* ------------------------------------------------------------------ */

export function ResultsSection({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <div className="max-h-72 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl border border-white/10 bg-surface-2/60"
        />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center"
    >
      <p className="text-sm text-red-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Actions: copy / download                                            */
/* ------------------------------------------------------------------ */

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard unavailable (permissions) — fail silently.
        }
      }}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

/** Download text content as a file. */
export function DownloadTextButton({
  filename,
  content,
  mimeType = "text/plain",
  label = "Download",
}: {
  filename: string;
  content: string;
  mimeType?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      }}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/** Download an image/result URL (data: or http(s)) as a file. */
export function DownloadMediaButton({
  url,
  filename,
  label = "Download",
}: {
  url: string;
  filename: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = objectUrl;
          anchor.download = filename;
          anchor.click();
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Fallback: plain link download.
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = filename;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.click();
        }
      }}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
