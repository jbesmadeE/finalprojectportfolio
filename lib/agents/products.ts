/**
 * Shared logic for the Walmart + Amazon Product Hunters.
 * Listings come from the ProductProvider; optional LLM scoring falls back to
 * the provider's own scores when it fails or is not configured.
 */
import { z } from "zod";
import {
  getLLMProvider,
  getProductProvider,
  type ProductListing,
  type ProviderMode,
} from "@/lib/providers";
import { llmConfigured } from "@/lib/env";
import type { ProductRequest } from "@/lib/schemas/product";

const llmScoreSchema = z.array(
  z.object({
    opportunityScore: z.number().min(0).max(100),
    reasons: z.array(z.string()).max(3),
  }),
);

async function scoreWithLLM(
  listings: ProductListing[],
): Promise<ProductListing[]> {
  const { provider } = getLLMProvider();
  const compact = listings.map((listing, index) => ({
    index,
    title: listing.title,
    price: listing.price,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
  }));

  const raw = await provider.complete({
    system:
      "You are an e-commerce product research expert. For each product, score the opportunity from 0 to 100 (higher = better bet for a reseller: demand vs competition, margin potential, review velocity). Reply with ONLY a JSON array of {index, opportunityScore, reasons[<=2 short strings]} matching the input order.",
    prompt: JSON.stringify(compact),
  });

  const jsonText = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
  const scores = llmScoreSchema.parse(JSON.parse(jsonText));

  return listings.map((listing, index) => {
    const score = scores[index];
    return score
      ? { ...listing, opportunityScore: score.opportunityScore, reasons: score.reasons }
      : listing;
  });
}

export async function runProductHunter(
  marketplace: string,
  request: ProductRequest,
): Promise<{ mode: ProviderMode; listings: ProductListing[] }> {
  const { mode, provider } = getProductProvider(marketplace);
  let listings = await provider.search({
    keyword: request.keyword,
    minPrice: request.minPrice ?? null,
    maxPrice: request.maxPrice ?? null,
  });

  // Failures fall back to the provider's own scores.
  if (llmConfigured && listings.length > 0) {
    try {
      listings = await scoreWithLLM(listings);
    } catch (error) {
      console.error(`[${marketplace}] LLM scoring failed, using provider scores:`, error);
    }
  }

  return { mode, listings };
}
