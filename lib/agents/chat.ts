/**
 * Chatbot agent. Answers are grounded ONLY in JB's resume (provided text)
 * and the available workspace/tool functions on this site.
 * Real mode uses the OpenAI-compatible gateway; mock mode returns canned
 * replies scoped to the same sources.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env, llmConfigured } from "@/lib/env";

/** Resume text provided by the user (source: public/projects/John Brian C Esmade (JB).pdf). */
const JB_RESUME_TEXT = `John Brian C Esmade (JB)
E-commerce Operations Specialist · Workflow Automation · SEO & Digital Marketing
Iligan City, Philippines · 
 jbesmade@gmail.com · 
 +639559772486 
Professional Summary
Results-driven virtual assistant and agency operator with 15+ years in digital marketing
and e-commerce. Started in SEO in 2006 and went on to run a multi-VA agency managing
marketplace stores across Amazon, Walmart, eBay and Newegg using dropshipping, 2
step, FBA and WFS fulfillment models. Strong at building automations that cut manual
work, and at training and leading remote teams.
Core Skills
E-commerce VA: Amazon, Walmart, Newegg, eBay
Workflow Automation: Make, n8n, GoHighLevel (GHL), Zapier
Search & Content: SEO, AEO (Answer Engine Optimization), Social Media Marketing
Virtual Assistance: Personal VA, Vibe Coding, Lead Generation
Creator Management: OnlyFans VA / Chatter
Professional Experience
E-commerce Agency Owner / Store Operations Manager
Multiple Clients · 2011 – 2026
Ran an e-commerce management agency handling store operations for multiple
clients on Amazon, Walmart, eBay and Newegg.
Executed dropshipping, 2-step, FBA and WFS (Walmart Fulfillment Services)
fulfillment models depending on each store.
Recruited, trained and supervised a team of virtual assistants working across client
accounts.
Managed listings, orders, inventory and day-to-day marketplace operations.
SEO Specialist
2006 – 2011
Started a career in search engine optimization at the early stage of the industry.
Handled on-page and off-page optimization to grow search visibility and traffic 
Freelance Virtual Assistant & Automation Specialist
Present
Build and maintain workflow automations with Make, n8n, GoHighLevel and Zapier.
Provide lead generation, social media management, personal VA support and
chatting/creator-account support.
Use AI-assisted "vibe coding" to build quick tools and scripts that speed up client
work`;

/** Descriptions of available workspace/tool functions on this site. */
const WORKSPACE_FUNCTIONS_TEXT = `
Available workspace tools/functions on this portfolio site:
1. Walmart Product Hunter: input a keyword and optional min/max price (USD); returns ranked Walmart product listings with opportunity score, price, rating, review count, reasons, and listing URL. Results can be exported as JSON. May show mock data when live results are not configured.
2. Amazon Product Hunter: same inputs and outputs as Walmart Product Hunter, but for Amazon listings.
3. SEO Website Analysis: input an https:// page URL; returns an SEO score (0–100), a summary, and checks with pass/warn/fail status and details. Report can be copied or downloaded.
4. Image Generator: input a prompt plus size/style; generates an image (real mode uses Cloudflare Workers AI model @cf/black-forest-labs/flux-2-klein-9b when configured, otherwise mock). Generated image can be viewed in-app (zoom) and downloaded/opened.
5. Video Generator (Text-to-Video only): input a prompt; generates a video with fixed 5-second duration via asynchronous job polling (real mode uses Magic Hour when configured, otherwise mock).
6. Job Hunter: input a keyword; searches OnlineJobs.ph and returns job listings with Title, Author, Rate, and job posting URL (and may include job type, posted date, categories, and total when available). Author may be "Not listed" depending on source data.
`.trim();

export const CHAT_SYSTEM_PROMPT = [
  "You are JB's portfolio assistant on this website.",
  "You MUST answer ONLY using the information in (A) JB's resume and (B) the available workspace tool functions below. Do not use outside knowledge or make assumptions.",
  "",
  "=== (A) JB's Resume ===",
  JB_RESUME_TEXT,
  "",
  "=== (B) Available Workspace Tool Functions ===",
  WORKSPACE_FUNCTIONS_TEXT,
  "",
  "Rules:",
  "- If the answer is not supported by the resume or the workspace functions above, clearly say you can only answer based on JB's resume and the available tools on this site, and ask what they'd like to know within that scope.",
  "- Do not invent details, prices, guarantees, clients, metrics, dates, or capabilities not stated in the sources.",
  "- When relevant, mention they can use the Book an Appointment button on this page to connect with JB.",
  "- For contact/booking questions, you may share contact details that appear in the resume (email/phone/location) and/or point to the Book an Appointment button.",
  "- Keep answers clear and concise (typically 1–4 short sentences or a brief list when helpful).",
].join("\n");

/** Returns the streaming model, or null when no gateway is configured. */
export function getChatModel() {
  if (!llmConfigured) return null;
  const provider = createOpenAICompatible({
    name: "portfolio-gateway",
    baseURL: env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    apiKey: env.OPENAI_API_KEY,
  });
  return provider.chatModel(env.OPENAI_MODEL ?? "gpt-4o-mini");
}

const MOCK_PREFIX = "[mock mode — set OPENAI_API_KEY for real replies]\n\n";

/** Scoped canned answers for offline demos (resume + workspace functions only). */
export function buildMockReply(userText: string): string {
  const text = userText.toLowerCase();

  if (/\b(hi|hello|hey|good\s+(morning|afternoon|evening))\b/.test(text)) {
    return `${MOCK_PREFIX}Hi! I'm JB's assistant. I can answer questions based on JB's resume and the available workspace tools on this site (Walmart/Amazon Product Hunter, SEO Website Analysis, Image Generator, Video Generator, Job Hunter).`;
  }

  if (/(contact|email|phone|number|reach|location|where|based|iligan)/.test(text)) {
    return `${MOCK_PREFIX}Based on JB's resume: JB (John Brian C Esmade) is based in Iligan City, Philippines. Email: jbesmade@gmail.com. Phone: +639559772486. You can also use the Book an Appointment button on this page.`;
  }

  if (/(appoint|book|schedule|meeting|call|hire|work with)/.test(text)) {
    return `${MOCK_PREFIX}You can book time with JB using the Book an Appointment button on this page. For direct contact, JB's resume lists jbesmade@gmail.com and +639559772486.`;
  }

  if (/(who (is|are) (jb|john)|about jb|about you|summary|profile|background)/.test(text)) {
    return `${MOCK_PREFIX}JB (John Brian C Esmade) is an E-commerce Operations Specialist focused on workflow automation and SEO/digital marketing (Iligan City, Philippines). He has 15+ years in digital marketing and e-commerce, started in SEO in 2006, and ran a multi-VA agency managing marketplace stores across Amazon, Walmart, eBay, and Newegg.`;
  }

  if (/(experience|work history|worked|career|role|agency|operations manager|professional experience)/.test(text)) {
    return `${MOCK_PREFIX}JB's resume: SEO Specialist (2006–2011); E-commerce Agency Owner/Store Operations Manager for multiple clients (2011–2026) handling Amazon, Walmart, eBay, Newegg (dropshipping, 2-step, FBA, WFS), listings/orders/inventory and team supervision; currently Freelance Virtual Assistant & Automation Specialist.`;
  }

  if (/(skill|skills|core skills|tools|automation|make|n8n|gohighlevel|ghl|zapier|seo|aeo|lead gen|social media|vibe coding|chatter|onlyfans)/.test(text)) {
    return `${MOCK_PREFIX}Core skills from JB's resume: E-commerce VA (Amazon, Walmart, Newegg, eBay); Workflow Automation (Make, n8n, GoHighLevel/GHL, Zapier); SEO, AEO, Social Media Marketing; Personal VA, Vibe Coding, Lead Generation; OnlyFans VA/Chatter.`;
  }

  if (/(amazon|walmart|newegg|ebay|fba|wfs|dropship|2-step|marketplace|listing|inventory|order)/.test(text)) {
    return `${MOCK_PREFIX}From JB's resume: managed marketplace stores across Amazon, Walmart, eBay, and Newegg using dropshipping, 2-step, FBA, and WFS; handled listings, orders, inventory, and operations. On this site you can also try the Walmart/Amazon Product Hunter tools (keyword + optional price range).`;
  }

  if (/\bseo\b/.test(text) && /(tool|website analysis|analy|audit|score|url|page)/.test(text)) {
    return `${MOCK_PREFIX}SEO Website Analysis tool: enter an https:// URL to get an SEO score (0–100), summary, and pass/warn/fail checks (copy/download available).`;
  }

  if (/\bseo\b|\baeo\b/.test(text)) {
    return `${MOCK_PREFIX}JB's resume includes SEO and AEO experience (SEO Specialist 2006–2011; ongoing SEO/AEO and digital marketing skills). This site also has an SEO Website Analysis tool for auditing an https:// page URL.`;
  }

  if (/(walmart|amazon).*(tool|hunter|product)|product hunter/.test(text)) {
    return `${MOCK_PREFIX}Walmart/Amazon Product Hunter tools: enter a keyword and optional min/max price (USD) to get ranked listings with opportunity score, price, rating, reviews, reasons, and URL (exportable as JSON).`;
  }

  if (/\bimage\b.*(tool|generator|generate)|\bgenerate\b.*\bimage\b/.test(text)) {
    return `${MOCK_PREFIX}Image Generator tool: enter a prompt with size/style to generate an image (Cloudflare FLUX.2 klein 9B when configured, otherwise mock). You can zoom and download/open the result in-app.`;
  }

  if (/\bvideo\b.*(tool|generator|generate)|\bgenerate\b.*\bvideo\b|text.?to.?video/.test(text)) {
    return `${MOCK_PREFIX}Video Generator tool (Text-to-Video only): enter a prompt to generate a fixed 5-second video via async job polling (Magic Hour when configured, otherwise mock).`;
  }

  if (/\bjob\b.*(tool|hunter|search)|job hunter|onlinejobs/.test(text)) {
    return `${MOCK_PREFIX}Job Hunter tool: enter a keyword to search OnlineJobs.ph and view listings with Title, Author, Rate, and job posting URL (plus job type/posted/categories/total when available).`;
  }

  if (/(workspace|tool|tools|feature|features|what can (this|you) do)/.test(text)) {
    return `${MOCK_PREFIX}Available tools on this site: Walmart Product Hunter, Amazon Product Hunter, SEO Website Analysis, Image Generator, Video Generator (5s Text-to-Video), and Job Hunter (OnlineJobs.ph). I can also answer questions based on JB's resume.`;
  }

  return `${MOCK_PREFIX}I can only answer based on JB's resume and the available workspace tools on this site. Ask about JB's experience, skills, contact details, or how to use the site tools (Walmart/Amazon Product Hunter, SEO Website Analysis, Image Generator, Video Generator, Job Hunter).`;
}
