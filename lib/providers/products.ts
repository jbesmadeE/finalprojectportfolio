import type { ProviderMode } from "@/lib/env";

export type ProductListing = {
  title: string;
  price: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number | null;
  url: string;
  opportunityScore: number | null;
  reasons: string[];
};

export interface ProductSearchInput {
  keyword: string;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface ProductProvider {
  readonly marketplace: string;
  search(input: ProductSearchInput): Promise<ProductListing[]>;
}

const MOCK_TITLES = [
  "Ergonomic Laptop Stand (Adjustable)",
  "Silicone Cooking Utensil Set, 12-piece",
  "LED Strip Lights, 16.4ft, App Control",
  "Memory Foam Pillow, Cooling Gel",
  "Portable Blender, USB Rechargeable",
];

export class MockProductProvider implements ProductProvider {
  readonly marketplace: string;

  constructor(marketplace: string) {
    this.marketplace = marketplace;
  }

  async search(input: ProductSearchInput): Promise<ProductListing[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_TITLES.map((base, index) => {
      const title = input.keyword ? `${input.keyword} — ${base}` : base;
      return {
        title,
        price: 9.99 + index * 7.5,
        currency: "USD",
        rating: 3.6 + (index % 3) * 0.4,
        reviewCount: 120 + index * 340,
        url: `https://example.com/${this.marketplace}/${index + 1}`,
        opportunityScore: [82, 74, 66, 58, 41][index],
        reasons: [
          index < 2
            ? "Strong demand with limited competition"
            : "Moderate demand, saturated niche",
        ],
      };
    });
  }
}

export function getProductProvider(marketplace: string): {
  mode: ProviderMode;
  provider: ProductProvider;
} {
  return { mode: "mock", provider: new MockProductProvider(marketplace) };
}
