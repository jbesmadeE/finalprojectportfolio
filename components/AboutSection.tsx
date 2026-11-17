"use client";

import { useState } from "react";
import { about } from "@/lib/data/about";
import ToolModal from "@/components/ToolModal";

/**
 * About hero: shimmering gradient name, role label with a live pulse dot,
 * and a one-sentence teaser with a "Read More" modal containing the full
 * summary. All motion (shimmer/ping) is neutralized globally under
 * prefers-reduced-motion (app/globals.css).
 */
export default function AboutSection() {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-label={`About ${about.name}`}
      className="flex flex-col items-start gap-1.5"
    >
      <h1 className="flex flex-col gap-1">
        {/* Name — attention grabber: violet shimmer sweep + soft glow */}
        <span className="bg-gradient-to-r from-zinc-100 via-accent-strong to-zinc-100 bg-[length:200%_auto] bg-clip-text text-xl leading-tight font-bold tracking-tight text-transparent animate-shimmer drop-shadow-[0_0_22px_rgba(139,92,246,0.3)] sm:text-2xl lg:text-3xl">
          {about.name}
        </span>

        {/* Role — small caps label with pulsing availability dot */}
        <span className="flex items-center gap-2 text-[9px] leading-snug font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:text-[10px] lg:text-[11px] lg:tracking-[0.2em]">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {about.role}
        </span>
      </h1>

      {/* Teaser — accent-barred lead paragraph with inline "Read More" */}
      <p className="w-full border-l-2 border-accent/50 pl-2.5 text-xs leading-snug text-zinc-400 sm:text-[13px] lg:pl-3 lg:text-sm lg:leading-relaxed">
        {about.summaryTeaser}{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline font-medium text-accent-strong underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Read More
        </button>
      </p>

      {/* Small popup box with the full summary */}
      <ToolModal open={open} onClose={() => setOpen(false)} title="About JB">
        <p className="text-sm leading-relaxed text-zinc-300">{about.summary}</p>
      </ToolModal>
    </section>
  );
}
