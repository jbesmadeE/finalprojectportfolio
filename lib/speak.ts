/**
 * Browser text-to-speech helper (Web Speech API).
 * Runs only on the client; safe to import from client components.
 */

export const PROFILE_INTRO_TEXT =
  "Hi my name is JB. To know more about me. Book an appointment!  I am a results-driven virtual assistant and agency operator with 15+ years in digital marketing and e-commerce. Started in SEO in 2006 and went on to run a multi-VA agency managing marketplace stores across Amazon, Walmart, eBay and Newegg using dropshipping, 2- step, FBA and WFS fulfillment models. Strong at building automations that cut manual work, and at training and leading remote teams.";

let currentUtterance: SpeechSynthesisUtterance | null = null;

/** Speak the given text, cancelling any in-progress speech first. */
export function speakText(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  currentUtterance = utterance;
  utterance.onend = () => {
    if (currentUtterance === utterance) currentUtterance = null;
  };
  utterance.onerror = () => {
    if (currentUtterance === utterance) currentUtterance = null;
  };

  synth.speak(utterance);
}

/** Speak the profile introduction used for profile/orbital interactions. */
export function speakProfileIntro(): void {
  speakText(PROFILE_INTRO_TEXT);
}
