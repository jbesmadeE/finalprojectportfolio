"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  RotateCw,
  Power,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  type WeatherMode,
  type WeatherState,
  ALL_MODES,
  getWeatherMeta,
} from "@/lib/weather";

interface WeatherControlPillProps {
  detectedWeather: WeatherState | null;
  overrideMode: WeatherMode | null;
  enabled: boolean;
  onSelectMode: (mode: WeatherMode | null) => void;
  onToggleEnabled: () => void;
  /** Renders the pill into this element id (stacked above the workspace callout). */
  targetId?: string;
}

export default function WeatherControlPill({
  detectedWeather,
  overrideMode,
  enabled,
  onSelectMode,
  onToggleEnabled,
  targetId,
}: WeatherControlPillProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (targetId) {
      // Portal targets live outside this component, so they can only be resolved after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPortalTarget(document.getElementById(targetId));
    }
  }, [targetId]);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const activeMode: WeatherMode =
    overrideMode ?? detectedWeather?.mode ?? "clear-day";
  const activeMeta = getWeatherMeta(activeMode);

  // Text label: e.g. "Manila · Clear" or "Rain (Preview)"
  let displayText = "Loading weather...";
  if (!enabled) {
    displayText = "Weather Off";
  } else if (overrideMode) {
    displayText = `${activeMeta.label} (Preview)`;
  } else if (detectedWeather) {
    displayText = detectedWeather.city
      ? `${detectedWeather.city} · ${detectedWeather.label}`
      : detectedWeather.label;
  }

  // Cycle through modes: Live -> Clear Day -> Clear Night -> Cloudy -> Fog -> Rain -> Snow -> Thunderstorm -> Live
  const handleCycle = () => {
    if (!enabled) {
      onToggleEnabled(); // Turn on if currently off
      return;
    }

    if (overrideMode === null) {
      onSelectMode("clear-day");
    } else {
      const currentIndex = ALL_MODES.findIndex((m) => m.mode === overrideMode);
      if (currentIndex === -1 || currentIndex === ALL_MODES.length - 1) {
        onSelectMode(null); // Back to live detected
      } else {
        onSelectMode(ALL_MODES[currentIndex + 1].mode);
      }
    }
  };

  const content = (
    <div
      ref={containerRef}
      className={portalTarget ? "relative z-30" : "fixed bottom-24 left-3 z-30 sm:bottom-28 sm:left-5"}
    >
      {/* Popover Menu for quick direct selection — opens downward when stacked on top */}
      {menuOpen && (
        <div
          role="menu"
          aria-label="Weather modes"
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-surface-2/95 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-fade-in"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Weather Preview
          </div>

          {/* Live Detected option */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onSelectMode(null);
              setMenuOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              overrideMode === null && enabled
                ? "bg-accent/20 text-accent-strong font-medium"
                : "text-zinc-300 hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{detectedWeather?.icon ?? "🛰️"}</span>
              <span>
                Live ({detectedWeather?.city ?? "Detected"})
              </span>
            </span>
            {overrideMode === null && enabled && <Check className="h-3.5 w-3.5" />}
          </button>

          <div className="my-1 border-t border-white/10" />

          {/* Preset Modes */}
          {ALL_MODES.map((item) => (
            <button
              key={item.mode}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectMode(item.mode);
                setMenuOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-xs transition-colors ${
                overrideMode === item.mode && enabled
                  ? "bg-accent/20 text-accent-strong font-medium"
                  : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {overrideMode === item.mode && enabled && (
                <Check className="h-3.5 w-3.5" />
              )}
            </button>
          ))}

          <div className="my-1 border-t border-white/10" />

          {/* Toggle On/Off */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onToggleEnabled();
              setMenuOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              !enabled
                ? "bg-red-500/20 text-red-300 font-medium"
                : "text-zinc-400 hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Power className="h-3 w-3" />
              <span>{enabled ? "Disable Effects" : "Enable Effects"}</span>
            </span>
          </button>
        </div>
      )}

      {/* Main Minimal Floating Pill */}
      <div
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 shadow-lg backdrop-blur-md transition-all sm:px-2.5 sm:py-1 ${
          enabled
            ? "border-white/15 bg-surface-2/80 text-zinc-200 hover:border-accent/40 hover:shadow-[0_0_16px_rgba(139,92,246,0.15)]"
            : "border-white/10 bg-surface-2/60 text-zinc-500"
        }`}
      >
        {/* Toggle popup / label button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          title="Click to select weather mode"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          className="flex items-center gap-1.5 rounded-full px-1 text-[11px] font-medium transition-colors hover:text-accent-strong sm:text-xs"
        >
          <span className="select-none text-xs sm:text-sm">
            {enabled ? (overrideMode ? activeMeta.icon : detectedWeather?.icon ?? "☀️") : "🚫"}
          </span>
          <span className="max-w-[130px] truncate sm:max-w-[180px]">
            {displayText}
          </span>
          <ChevronDown
            className={`h-3 w-3 text-zinc-400 transition-transform ${
              menuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Separator */}
        <span className="h-3 w-px bg-white/10" aria-hidden="true" />

        {/* Quick Cycle button */}
        <button
          type="button"
          onClick={handleCycle}
          title="Cycle weather mode"
          aria-label="Cycle weather preview"
          className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCw className="h-3 w-3" />
        </button>

        {/* Quick Power / Toggle button */}
        <button
          type="button"
          onClick={onToggleEnabled}
          title={enabled ? "Turn weather off" : "Turn weather on"}
          aria-label={enabled ? "Turn weather off" : "Turn weather on"}
          className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
            enabled
              ? "text-zinc-400 hover:bg-white/10 hover:text-white"
              : "text-red-400 hover:bg-red-500/20"
          }`}
        >
          <Power className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  if (targetId && !portalTarget) return null;

  return portalTarget ? createPortal(content, portalTarget) : content;
}
