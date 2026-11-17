"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import ToolModal from "@/components/ToolModal";
import {
  AgentForm,
  DownloadMediaButton,
  ErrorState,
  LabeledField,
  SkeletonCards,
  inputClass,
} from "@/components/AgentModalUI";
import { imageResponseSchema, type ImageResponse } from "@/lib/schemas/image";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: ImageResponse };

function imageSrc(image: ImageResponse["image"]): string {
  return "url" in image ? image.url : `data:${image.mimeType};base64,${image.base64}`;
}

const SIZES = [
  { value: "1024x1024", label: "Square (1024×1024)" },
  { value: "1024x1792", label: "Portrait (1024×1792)" },
  { value: "1792x1024", label: "Landscape (1792×1024)" },
] as const;

const STYLES = [
  { value: "", label: "No style" },
  { value: "photorealistic", label: "Photorealistic" },
  { value: "illustration", label: "Illustration" },
  { value: "logo", label: "Logo" },
  { value: "flat", label: "Flat / minimal" },
] as const;

/** Image Generator agent modal — prompt/size/style in, image + download out. */
export default function ImageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<(typeof SIZES)[number]["value"]>("1024x1024");
  const [style, setStyle] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [zoomed, setZoomed] = useState(false);
  const reducedMotion = useReducedMotion();

  const handleClose = useCallback(() => {
    setZoomed(false);
    onClose();
  }, [onClose]);

  // Intercept Escape in capture phase before ToolModal's document listener.
  useEffect(() => {
    if (!zoomed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setZoomed(false);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [zoomed]);

  async function run() {
    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/agents/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, size, style: style || null }),
      });
      const json = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Request failed.");
      }
      const parsed = imageResponseSchema.safeParse(json);
      if (!parsed.success) throw new Error("Unexpected response shape.");
      setStatus({ kind: "done", data: parsed.data });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  const src = status.kind === "done" ? imageSrc(status.data.image) : null;

  return (
    <ToolModal open={open} onClose={handleClose} title="Image Generator" maxWidth="max-w-xl">
      <AgentForm
        onSubmit={() => {
          setZoomed(false);
          void run();
        }}
        busy={status.kind === "loading"}
        submitLabel="Generate"
      >
        <LabeledField label="Prompt">
          <textarea
            className={`${inputClass} min-h-20 resize-none`}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="e.g. minimalist product photo of a coffee mug on dark background"
            required
            maxLength={1000}
          />
        </LabeledField>
        <div className="grid grid-cols-2 gap-3">
          <LabeledField label="Size">
            <select
              className={inputClass}
              value={size}
              onChange={(event) =>
                setSize(event.target.value as (typeof SIZES)[number]["value"])
              }
            >
              {SIZES.map((option) => (
                <option key={option.value} value={option.value} className="bg-surface">
                  {option.label}
                </option>
              ))}
            </select>
          </LabeledField>
          <LabeledField label="Style">
            <select
              className={inputClass}
              value={style}
              onChange={(event) => setStyle(event.target.value)}
            >
              {STYLES.map((option) => (
                <option key={option.value} value={option.value} className="bg-surface">
                  {option.label}
                </option>
              ))}
            </select>
          </LabeledField>
        </div>
      </AgentForm>

      {status.kind === "loading" && (
        <div className="mt-4">
          <SkeletonCards count={2} />
        </div>
      )}
      {status.kind === "error" && (
        <div className="mt-4">
          <ErrorState message={status.message} onRetry={run} />
        </div>
      )}
      {status.kind === "done" && src && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
          <motion.button
            type="button"
            onClick={() => setZoomed(true)}
            className="group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Enlarge generated image"
            title="Click to enlarge"
            whileHover={reducedMotion ? undefined : { scale: 1.02 }}
            whileTap={reducedMotion ? undefined : { scale: 1.35 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data/media URLs are arbitrary sources */}
            <img
              src={src}
              alt={prompt}
              className="max-h-64 w-full cursor-zoom-in object-contain"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-md border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-zinc-200 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Click to enlarge
            </span>
          </motion.button>
          <div className="flex items-center gap-2">
            <DownloadMediaButton url={src} filename="generated-image" label="Download" />
            {status.data.mode === "mock" && (
              <span className="text-xs text-zinc-600">mock image</span>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && zoomed && src && (
          <motion.div
            key="image-zoom"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0.15 } : { duration: 0.2 }}
            onClick={() => setZoomed(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged generated image"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              className="relative z-10 max-h-full max-w-5xl"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={
                reducedMotion
                  ? { duration: 0.15 }
                  : { type: "spring", stiffness: 400, damping: 30 }
              }
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setZoomed(false)}
                aria-label="Close enlarged image"
                className="absolute -right-2 -top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-surface-2/90 text-zinc-200 shadow-lg backdrop-blur transition-colors hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:-right-3 sm:-top-3"
              >
                <X className="h-4 w-4" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data/media URLs are arbitrary sources */}
              <img
                src={src}
                alt={prompt}
                className="max-h-[85vh] w-auto max-w-full rounded-xl border border-white/10 bg-surface object-contain shadow-2xl shadow-black/60"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolModal>
  );
}
