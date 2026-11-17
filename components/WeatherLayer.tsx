"use client";

import { useEffect, useState } from "react";
import WeatherBackground from "@/components/WeatherBackground";
import WeatherControlPill from "@/components/WeatherControlPill";
import {
  type WeatherMode,
  type WeatherState,
  fetchClientWeather,
  guessLocalMode,
} from "@/lib/weather";

export default function WeatherLayer() {
  const [detectedWeather, setDetectedWeather] = useState<WeatherState | null>(null);
  const [overrideMode, setOverrideMode] = useState<WeatherMode | null>(null);
  const [enabled, setEnabled] = useState(true);
  // Stable prerender-safe default; corrected to local day/night on mount so the
  // template isn't always "sunny" before live detection resolves (e.g. at night).
  const [initialMode, setInitialMode] = useState<WeatherMode>("clear-day");

  useEffect(() => {
    let isMounted = true;

    // Set an immediate local day/night guess on the client (deferred to satisfy
    // lint; avoids prerender-time Date and prevents a "sunny" flash at night).
    queueMicrotask(() => {
      if (isMounted) setInitialMode(guessLocalMode(new Date()));
    });

    async function initWeather() {
      try {
        const data = await fetchClientWeather();
        if (isMounted && data) {
          setDetectedWeather(data);
        }
      } catch {
        // fetchClientWeather already falls back internally; keep initial guess.
      }
    }

    initWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  // Live (no override): always follow dynamically detected weather.
  const activeMode: WeatherMode =
    overrideMode ?? detectedWeather?.mode ?? initialMode;

  return (
    <>
      {/* Fixed, full-screen background layer behind all content (z-[-1]) */}
      <WeatherBackground mode={activeMode} enabled={enabled} />

      {/* Minimal control — stacked above the workspace callout on mobile and desktop */}
      <WeatherControlPill
        targetId="weather-slot-mobile"
        detectedWeather={detectedWeather}
        overrideMode={overrideMode}
        enabled={enabled}
        onSelectMode={(mode) => setOverrideMode(mode)}
        onToggleEnabled={() => setEnabled((prev) => !prev)}
      />
      <WeatherControlPill
        targetId="weather-slot-desktop"
        detectedWeather={detectedWeather}
        overrideMode={overrideMode}
        enabled={enabled}
        onSelectMode={(mode) => setOverrideMode(mode)}
        onToggleEnabled={() => setEnabled((prev) => !prev)}
      />
    </>
  );
}
