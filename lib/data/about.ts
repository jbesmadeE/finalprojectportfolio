/**
 * About content.
 * NOTE: this file was recreated after it was accidentally deleted from the
 * repo (contents restored verbatim from the working copy).
 */
export type AboutData = {
  /** Name shown on the page. */
  name: string;
  /** Short role/title line. */
  role: string;
  /** First-sentence teaser shown on the single screen ("Read More" reveals the rest). */
  summaryTeaser: string;
  /** Full summary text shown inside the "Read More" modal. */
  summary: string;
  /** Full paragraphs shown inside the "Read more" modal. */
  fullBio: string[];
};

export const about: AboutData = {
  name: "John Brian 'JB' Esmade",
  role: "E-commerce VA (Amazon, Walmart, NewEgg, e-Bay, Shopee) · AI Automation (n8n, GHL, Make, Zapier) · SEO & AEO · Personal VA · OF Chatter",
  // Shown clipped on the page; "Read More" opens the full summary.
  summaryTeaser:
    "Results-driven virtual assistant and agency operator with 15+ years in digital marketing and e-commerce.",
  summary:
    `Results-driven virtual assistant and agency operator with 15+ years in digital marketing and e-commerce. Started in SEO in 2006 and went on to run a multi-VA agency managing marketplace stores across Amazon, Walmart, eBay and Newegg using dropshipping, 2- step, FBA and WFS fulfillment models. Strong at building automations that cut manual work, and at training and leading remote teams.`,
  // TODO(content): replace with real bio paragraphs (currently unused — the Read More modal shows `summary`)
  fullBio: [
    "PLACEHOLDER PARAGRAPH 1 — Tell the story here: background, how you got into e-commerce and virtual assistance, what you love about the work.",
    "PLACEHOLDER PARAGRAPH 2 — Concrete wins: product research results, listings optimized, tools mastered (Helium 10, Keepa, ChatGPT workflows, etc.).",
    "PLACEHOLDER PARAGRAPH 3 — What it is like to work with you: communication style, availability, and what a client can expect in the first 30 days.",
  ],
};
