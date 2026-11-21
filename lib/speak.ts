/**
 * Browser text-to-speech helper (Web Speech API).
 * Runs only on the client; safe to import from client components.
 *
 * Desktop engines speak a long paragraph without complaint, but mobile engines
 * are much stricter, so this module works around three of their quirks:
 *
 * 1. Chrome/Android silently drops long utterances (roughly 15s of speech, or
 *    a few hundred characters), so the intro is split into sentence-sized
 *    chunks that are queued together.
 * 2. Chrome/Android can report an empty voice list until `voiceschanged` fires.
 *    Speech queued before that is dropped, so voices are warmed on mount and a
 *    watchdog re-queues once if the engine never started.
 * 3. Chrome can leave the queue stuck in a paused state after the tab was
 *    backgrounded, so `resume()` runs before every utterance.
 *
 * iOS Safari only honours speech requested from a user gesture, so the first
 * utterance is always created and queued synchronously inside the tap handler,
 * never after an `await`. Only a repeat tap — by which point the engine is
 * already unlocked — waits a tick so `cancel()` can clear the old queue.
 */

export const PROFILE_INTRO_TEXT =
  "Hi my name is JB. To know more about me. Book an appointment!  I am a results-driven virtual assistant and agency operator with 15+ years in digital marketing and e-commerce. Started in SEO in 2006 and went on to run a multi-VA agency managing marketplace stores across Amazon, Walmart, eBay and Newegg using dropshipping, 2- step, FBA and WFS fulfillment models. Strong at building automations that cut manual work, and at training and leading remote teams.";

/** Longest chunk handed to one utterance (keeps Android from dropping it). */
const MAX_CHUNK_LENGTH = 180;

/** How long to wait for the engine to start before re-queuing once. */
const START_WATCHDOG_MS = 900;

let voicesBound = false;
let startWatchdog: ReturnType<typeof setTimeout> | null = null;

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  return window.speechSynthesis;
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

/** Warm the engine before the first tap so speech starts without delay. */
export function prewarmSpeech(): void {
  const synth = getSynth();
  if (!synth) return;
  readVoices(synth);
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

/** Speak the given text, cancelling any in-progress speech first. */
export function speakText(text: string): void {
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

/** Speak the profile introduction used for profile/orbital interactions. */
export function speakProfileIntro(): void {
  speakText(PROFILE_INTRO_TEXT);
}
