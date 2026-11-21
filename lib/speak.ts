/**
 * Profile intro audio.
 *
 * A recorded clip is played first because the Web Speech API is unreliable on
 * phones: many mobile browsers and in-app WebViews (Instagram, Facebook,
 * Messenger) disable `speechSynthesis`, and iOS mutes it in some modes. A plain
 * <audio> element triggered by a tap plays everywhere.
 *
 * The browser voice is still used as a fallback when the clip is missing or
 * cannot play, and the mobile quirks it needs to work around are documented
 * below.
 */

const PROFILE_INTRO_TEXT =
  "Hi my name is JB. To know more about me. Book an appointment!  I am a results-driven virtual assistant and agency operator with 15+ years in digital marketing and e-commerce. Started in SEO in 2006 and went on to run a multi-VA agency managing marketplace stores across Amazon, Walmart, eBay and Newegg using dropshipping, 2- step, FBA and WFS fulfillment models. Strong at building automations that cut manual work, and at training and leading remote teams.";

/** Recorded intro, served from public/audio. */
const INTRO_AUDIO_MP4 = "/audio/intro.m4a";
const INTRO_AUDIO_MP3 = "/audio/intro.mp3";

/** Longest chunk handed to one utterance (keeps Android from dropping it). */
const MAX_CHUNK_LENGTH = 180;

/** How long to wait for the engine to start before re-queuing once. */
const START_WATCHDOG_MS = 900;

let voicesBound = false;
let startWatchdog: ReturnType<typeof setTimeout> | null = null;
let introAudio: HTMLAudioElement | null = null;

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  return window.speechSynthesis;
}

/**
 * One reusable <audio> element. Reusing it keeps the clip buffered between taps
 * and avoids creating a new element on every press.
 */
function getIntroAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (introAudio) return introAudio;

  const probe = document.createElement("audio");
  const supportsAac = probe.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== "";
  introAudio = new Audio(supportsAac ? INTRO_AUDIO_MP4 : INTRO_AUDIO_MP3);
  introAudio.preload = "auto";
  return introAudio;
}

/**
 * Touch the voice list so the engine starts loading it, and keep the cache warm
 * when the browser reports new voices (Android does this asynchronously).
 */
function readVoices(synth: SpeechSynthesis): SpeechSynthesisVoice[] {
  if (!voicesBound) {
    voicesBound = true;
    const refresh = () => {
      // Reading the list is what refreshes the engine's internal cache.
      synth.getVoices();
    };
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", refresh);
    } else {
      synth.onvoiceschanged = refresh;
    }
  }
  return synth.getVoices();
}

/**
 * Warm the intro before the first tap: buffer the clip and load the fallback
 * voice list (Android fills it in asynchronously).
 */
export function prewarmIntro(): void {
  const audio = getIntroAudio();
  if (audio) {
    // Starts buffering immediately so the first tap plays without a delay.
    audio.load();
  }
  const synth = getSynth();
  if (synth) readVoices(synth);
}

function clearWatchdog(): void {
  if (startWatchdog !== null) {
    clearTimeout(startWatchdog);
    startWatchdog = null;
  }
}

/**
 * Split text on sentence boundaries, then hard-wrap any remaining long
 * sentence on word boundaries. Every chunk stays under MAX_CHUNK_LENGTH.
 */
function chunkText(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current) {
      chunks.push(current);
      current = "";
    }
  };

  for (const raw of sentences) {
    let sentence = raw.trim();
    if (!sentence) continue;

    if (sentence.length > MAX_CHUNK_LENGTH) {
      flush();
      while (sentence.length > MAX_CHUNK_LENGTH) {
        let cut = sentence.lastIndexOf(" ", MAX_CHUNK_LENGTH);
        if (cut <= 0) cut = MAX_CHUNK_LENGTH;
        chunks.push(sentence.slice(0, cut).trim());
        sentence = sentence.slice(cut).trim();
      }
      current = sentence;
      continue;
    }

    if (current && current.length + 1 + sentence.length > MAX_CHUNK_LENGTH) {
      flush();
    }
    current = current ? `${current} ${sentence}` : sentence;
  }

  flush();
  return chunks;
}

function buildUtterance(text: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  // Pin the language so Android picks a matching voice even when the page or
  // device locale is something else.
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  return utterance;
}

function queueChunks(
  synth: SpeechSynthesis,
  chunks: string[],
  allowRetry: boolean,
): void {
  const voicesMissing = synth.getVoices().length === 0;

  chunks.forEach((chunk, index) => {
    const utterance = buildUtterance(chunk);
    // Once the engine starts talking, the queue is healthy: stop the watchdog
    // so a short pause between chunks can never replay the intro.
    if (index === 0) utterance.onstart = clearWatchdog;
    synth.speak(utterance);
  });

  // Only a missing voice list justifies a retry. Re-queuing when voices were
  // already available would risk speaking the intro twice on slow engines.
  if (!allowRetry || !voicesMissing) return;

  startWatchdog = setTimeout(() => {
    startWatchdog = null;
    if (synth.speaking || synth.pending) return;
    if (synth.getVoices().length === 0) return;

    try {
      synth.resume();
    } catch {
      // Older engines expose resume() without a usable implementation.
    }
    queueChunks(synth, chunks, false);
  }, START_WATCHDOG_MS);
}

/**
 * Browser voice fallback.
 *
 * Mobile engines are stricter than desktop ones, so this works around:
 * - Chrome/Android dropping long utterances → text is split into short chunks.
 * - Chrome/Android reporting an empty voice list until `voiceschanged` → the
 *   list is warmed on mount and a watchdog re-queues once.
 * - Chrome leaving the queue paused after the tab was hidden → resume() first.
 *
 * The first utterance is queued synchronously inside the tap so iOS keeps the
 * user gesture; only a repeat tap waits a tick for cancel() to settle.
 */
function speakText(text: string): void {
  const synth = getSynth();
  if (!synth) return;

  const trimmed = text.trim();
  if (!trimmed) return;

  clearWatchdog();
  readVoices(synth);

  const chunks = chunkText(trimmed);
  const play = () => {
    // Chrome can sit paused after the tab was hidden; this is a no-op otherwise.
    try {
      synth.resume();
    } catch {
      // Older engines expose resume() without a usable implementation.
    }
    queueChunks(synth, chunks, true);
  };

  if (synth.speaking || synth.pending) {
    // iOS drops an utterance queued in the same tick as cancel(), so clear the
    // old queue first. The first tap never reaches this branch, so speech still
    // starts synchronously inside the user gesture.
    synth.cancel();
    setTimeout(play, 0);
    return;
  }

  play();
}

/**
 * Play the profile introduction. The recorded clip is the primary source; the
 * browser voice only runs when the clip is missing or refuses to play.
 */
export function playProfileIntro(): void {
  const audio = getIntroAudio();
  if (!audio) {
    speakText(PROFILE_INTRO_TEXT);
    return;
  }

  // Stop any fallback speech that is still running.
  const synth = getSynth();
  if (synth && (synth.speaking || synth.pending)) {
    synth.cancel();
  }
  clearWatchdog();

  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // Metadata may not be loaded yet; play() starts the clip regardless.
  }

  const playback = audio.play();
  if (playback && typeof playback.catch === "function") {
    playback.catch((error: unknown) => {
      // A quick second tap pauses the first play(), which rejects with
      // AbortError. That is expected — only real failures fall back to speech.
      if (error instanceof DOMException && error.name === "AbortError") return;
      speakText(PROFILE_INTRO_TEXT);
    });
  }
}
