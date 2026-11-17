"use client";

/**
 * Cartoon speech-bubble callout about the tool stack.
 *
 * Two visual modes, controlled by the `variant` prop:
 *  - "mobile"  — wide strip (icon-left, text-right), right-aligned above the
 *                tool list so its tail points at the Walmart Product Hunter
 *                button. Used inside ToolButtons (hidden on lg).
 *  - "desktop" — vertical bubble with shadow depth.
 *                Used inside ToolButtons (lg: only, hidden on mobile).
 */

const CHAT_ICON = (
  <svg
    viewBox="0 0 48 40"
    fill="none"
    aria-hidden="true"
    className="shrink-0"
  >
    {/* Back bubble (gray) */}
    <rect x="0" y="10" width="30" height="22" rx="6" fill="#6b7280" stroke="#1f2937" strokeWidth="3" strokeLinejoin="round" />
    <path d="M6 32 L2 40 L14 34" fill="#6b7280" stroke="#1f2937" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    {/* Front bubble (violet-tinted) */}
    <rect x="8" y="2" width="34" height="24" rx="6" fill="#2e1f5e" stroke="#8b5cf6" strokeWidth="3" strokeLinejoin="round" />
    <path d="M38 26 L46 36 L32 28" fill="#2e1f5e" stroke="#8b5cf6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

const MSG = (
  <>
    Check Out my Workspace below! Its free! It does a lot of things!{" "}
    <span className="font-bold text-accent-strong">
      DO NOT WORRY! IT wont Bite! It wont collect Data.
    </span>
  </>
);

/** Wide bubble — right-aligned above the tool list on mobile/tablet. */
export function MobileBubble({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* shadow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-2xl border border-black/50 bg-surface-2/50"
      />
      <div className="relative flex items-start gap-2 rounded-2xl border border-accent/60 bg-surface px-2 py-1 shadow-[0_0_14px_rgba(139,92,246,0.15)]">
        {/* icon */}
        <span className="mt-0.5 h-7 w-7">{CHAT_ICON}</span>

        {/* text */}
        <p
          className="text-[9px] leading-snug text-zinc-300 sm:text-[10px]"
          style={{ fontFamily: "'Comic Sans MS','Chalkboard SE','Comic Neue',cursive" }}
        >
          {MSG}
        </p>

        {/* tail — points downward on the RIGHT, directly toward Walmart Product Hunter */}
        <div
          aria-hidden="true"
          className="absolute -bottom-[7px] right-16 h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-accent/60"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-[5px] right-[66px] h-0 w-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-surface"
        />
      </div>
    </div>
  );
}

/** Vertical bubble — desktop (inside the tools column). */
export function DesktopBubble({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mb-2.5 ${className}`}>
      {/* back shadow bubble */}
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl border-2 border-black/60 bg-surface-2/60"
      />
      {/* front bubble */}
      <div className="relative rounded-2xl border-2 border-accent/70 bg-surface px-3.5 py-3 shadow-[0_0_18px_rgba(139,92,246,0.18)]">
        {/* header row */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-6 w-6">{CHAT_ICON}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-strong/80">
            Hey, quick note!
          </span>
        </div>

        {/* message */}
        <p
          className="text-[11px] leading-snug text-zinc-300"
          style={{ fontFamily: "'Comic Sans MS','Chalkboard SE','Comic Neue',cursive" }}
        >
          {MSG}
        </p>

        {/* tail at bottom-left → points toward Walmart Product Hunter below */}
        <div
          aria-hidden="true"
          className="absolute -bottom-[9px] left-8 h-0 w-0 border-l-[8px] border-r-[8px] border-t-[9px] border-l-transparent border-r-transparent border-t-accent/70"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-[7px] left-[34px] h-0 w-0 border-l-[6px] border-r-[6px] border-t-[7px] border-l-transparent border-r-transparent border-t-surface"
        />
      </div>
    </div>
  );
}
