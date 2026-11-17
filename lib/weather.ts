/**
 * Client-side weather fetching & WMO weather code mapping.
 * 100% static, client-side only (no server routes, no navigator.geolocation popup).
 */

export type WeatherMode =
  | "clear-day"
  | "clear-night"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "thunderstorm";

export interface WeatherState {
  city: string | null;
  weatherCode: number;
  isDay: boolean;
  mode: WeatherMode;
  label: string;
  icon: string;
}

const CACHE_KEY = "jb_portfolio_weather_cache_v3";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const ALL_MODES: { mode: WeatherMode; label: string; icon: string }[] = [
  { mode: "clear-day", label: "Clear Day", icon: "☀️" },
  { mode: "clear-night", label: "Clear Night", icon: "🌙" },
  { mode: "cloudy", label: "Cloudy", icon: "☁️" },
  { mode: "fog", label: "Fog", icon: "🌫️" },
  { mode: "rain", label: "Rain", icon: "🌧️" },
  { mode: "snow", label: "Snow", icon: "❄️" },
  { mode: "thunderstorm", label: "Thunderstorm", icon: "⚡" },
];

/**
 * Maps WMO weather code and day/night to a WeatherMode template.
 * Dynamically picks night vs day for clear conditions, and condition-specific
 * templates for precipitation/fog/cloud cover.
 *
 * WMO reference (Open-Meteo): https://open-meteo.com/en/docs
 * - 0: Clear sky
 * - 1: Mainly clear, 2: Partly cloudy, 3: Overcast
 * - 45,48: Fog / depositing rime fog
 * - 51,53,55: Drizzle; 56,57: Freezing drizzle
 * - 61,63,65: Rain; 66,67: Freezing rain
 * - 71,73,75,77: Snow / snow grains
 * - 80,81,82: Rain showers
 * - 85,86: Snow showers
 * - 95,96,99: Thunderstorm
 */
export function mapWeatherCodeToMode(code: number, isDay: boolean): WeatherMode {
  if (code >= 95) return "thunderstorm";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code >= 2) return "cloudy"; // partly cloudy / overcast
  // 0 = clear sky, 1 = mainly clear -> sunny/clear template by day or night
  return isDay ? "clear-day" : "clear-night";
}

/** Best-effort local day/night guess (used before live weather resolves). */
export function guessLocalMode(now: Date): WeatherMode {
  const hour = now.getHours();
  const isDay = hour >= 6 && hour < 18;
  return isDay ? "clear-day" : "clear-night";
}

export function getWeatherMeta(mode: WeatherMode): { label: string; icon: string } {
  switch (mode) {
    case "clear-day":
      return { label: "Sunny", icon: "☀️" };
    case "clear-night":
      return { label: "Clear Night", icon: "🌙" };
    case "cloudy":
      return { label: "Cloudy", icon: "☁️" };
    case "fog":
      return { label: "Foggy", icon: "🌫️" };
    case "rain":
      return { label: "Rain", icon: "🌧️" };
    case "snow":
      return { label: "Snow", icon: "❄️" };
    case "thunderstorm":
      return { label: "Thunderstorm", icon: "⚡" };
  }
}

/**
 * Silent, robust client-side fetch with timeout.
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs = 4000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

function isLocalDayFallback(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

/**
 * Fallback weather state (used only when window is unavailable / SSR guard).
 */
export const DEFAULT_FALLBACK_WEATHER: WeatherState = {
  city: null,
  weatherCode: 0,
  isDay: true,
  mode: "clear-day",
  label: "Sunny",
  icon: "☀️",
};

type GeoResult = { lat: number; lon: number; city: string | null };

async function fetchGeo(): Promise<GeoResult | null> {
  const providers: Array<() => Promise<GeoResult | null>> = [
    async () => {
      const res = await fetchWithTimeout("https://ipwho.is/", 3500);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        success?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
        region?: string;
        country?: string;
      };
      if (data.success === false) return null;
      if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
        return null;
      }
      return {
        lat: data.latitude,
        lon: data.longitude,
        city: data.city || data.region || data.country || null,
      };
    },
    async () => {
      const res = await fetchWithTimeout("https://ipapi.co/json/", 3500);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        error?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
        region?: string;
        country_name?: string;
      };
      if (data.error) return null;
      if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
        return null;
      }
      return {
        lat: data.latitude,
        lon: data.longitude,
        city: data.city || data.region || data.country_name || null,
      };
    },
    async () => {
      const res = await fetchWithTimeout(
        "https://get.geojs.io/v1/ip/geo.json",
        3500,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        latitude?: string;
        longitude?: string;
        city?: string;
        region?: string;
        country?: string;
      };
      const lat = Number(data.latitude);
      const lon = Number(data.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return {
        lat,
        lon,
        city: data.city || data.region || data.country || null,
      };
    },
  ];

  for (const provider of providers) {
    try {
      const geo = await provider();
      if (geo) return geo;
    } catch {
      // try next provider
    }
  }
  return null;
}

type MeteoResult = { weatherCode: number; isDay: boolean };

async function fetchMeteo(lat: number, lon: number): Promise<MeteoResult | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
      `&longitude=${lon}&current=weather_code,is_day&timezone=auto`;
    const res = await fetchWithTimeout(url, 4500);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: { weather_code?: number; is_day?: number };
    };
    const current = data?.current;
    if (!current) return null;
    const weatherCode = Number(current.weather_code);
    const isDayRaw = Number(current.is_day);
    if (!Number.isFinite(weatherCode)) return null;
    return {
      weatherCode,
      isDay: Number.isFinite(isDayRaw) ? isDayRaw === 1 : isLocalDayFallback(),
    };
  } catch {
    return null;
  }
}

/**
 * Dynamically detects visitor weather (approx. location + Open-Meteo current
 * conditions) and maps it to a background template. Client-side only, cached in
 * sessionStorage. Falls back gracefully if geolocation/weather APIs are blocked.
 */
export async function fetchClientWeather(): Promise<WeatherState> {
  if (typeof window === "undefined") {
    return DEFAULT_FALLBACK_WEATHER;
  }

  // 1. Session cache (bump CACHE_KEY when logic changes to avoid stale results)
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as {
        data?: WeatherState;
        timestamp?: number;
      };
      if (
        parsed?.data &&
        typeof parsed.timestamp === "number" &&
        Date.now() - parsed.timestamp < CACHE_TTL_MS
      ) {
        return parsed.data;
      }
    }
  } catch {
    // ignore storage errors
  }

  // 2. Approximate location (best-effort; multiple providers for resilience)
  const geo = await fetchGeo();

  // 3. Current weather for detected location, or a reasonable local fallback
  let weatherCode = 0;
  let isDay = isLocalDayFallback();
  let city: string | null = geo?.city ?? null;

  if (geo) {
    const meteo = await fetchMeteo(geo.lat, geo.lon);
    if (meteo) {
      weatherCode = meteo.weatherCode;
      isDay = meteo.isDay;
    } else {
      // Location known but weather fetch failed: keep local day/night guess.
      weatherCode = 0;
    }
  } else {
    // No geo available (e.g. ad blocker). Use Open-Meteo's IP-based fallback is
    // not available client-side without coords, so infer day/night locally and
    // show a clear template rather than a falsely "detected" condition.
    weatherCode = 0;
    isDay = isLocalDayFallback();
    city = null;
  }

  const mode = mapWeatherCodeToMode(weatherCode, isDay);
  const meta = getWeatherMeta(mode);

  const result: WeatherState = {
    city,
    weatherCode,
    isDay,
    mode,
    label: meta.label,
    icon: meta.icon,
  };

  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data: result, timestamp: Date.now() }),
    );
  } catch {
    // ignore
  }

  return result;
}
