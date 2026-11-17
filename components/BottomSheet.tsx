"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  type PanInfo,
  type Transition,
} from "motion/react";
import { X } from "lucide-react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  children: ReactNode;
};

/**
 * Bottom sheet anchored to the bottom at 33dvh (layout.md).
 * Dismiss: outside tap / Esc / swipe-down drag.
 * Motion respects prefers-reduced-motion (fade only, no drag).
 */
export default function BottomSheet({
  open,
  onClose,
  label,
  children,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        ?.focus();
    }, 0);

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      // Focus trap: cycle Tab within the sheet.
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
          [],
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeydown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeydown, true);
      document.documentElement.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [open, onClose]);

  // Swipe-down dismiss (skipped entirely under reduced motion).
  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > 72 || info.velocity.y > 500) onClose();
  };

  const transition: Transition =
    reducedMotion
      ? { duration: 0.15, ease: "easeOut" }
      : { type: "spring", stiffness: 380, damping: 34 };

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(event) => {
        // Outside tap: only presses on the overlay itself.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* Overlay */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reducedMotion ? { duration: 0.15 } : { duration: 0.2 }}
        onClick={onClose}
      />

      {/* Sheet panel — 33dvh per layout.md */}
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={transition}
        drag={reducedMotion ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        className="absolute inset-x-0 bottom-0 flex h-[33dvh] flex-col overflow-hidden rounded-t-2xl border-t border-white/10 bg-surface-2/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        {/* Grab handle */}
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />

        <div className="flex items-start justify-between gap-4 px-4 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
