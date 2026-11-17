/**
 * Shared request/response schemas for the Walmart + Amazon Product Hunters.
 * walmart.ts / amazon.ts wrap these with marketplace-specific names.
 */
import { z } from "zod";

export const productRequestShape = {
  keyword: z.string().trim().min(1, "Keyword is required.").max(120),
  minPrice: z.number().nonnegative().max(1_000_000).nullish(),
  maxPrice: z.number().nonnegative().max(1_000_000).nullish(),
};

export const productListingSchema = z.object({
  title: z.string(),
  price: z.number().nullable(),
  currency: z.string(),
  rating: z.number().nullable(),
  reviewCount: z.number().nullable(),
  url: z.string(),
  /** LLM-computed 0–100 opportunity score (higher = better bet). */
  opportunityScore: z.number().nullable(),
  reasons: z.array(z.string()),
});

export const productResponseSchema = z.object({
  mode: z.enum(["real", "mock"]),
  listings: z.array(productListingSchema),
});

export type ProductRequest = {
  keyword: string;
  minPrice?: number | null;
  maxPrice?: number | null;
};

export type ProductResponse = z.infer<typeof productResponseSchema>;
