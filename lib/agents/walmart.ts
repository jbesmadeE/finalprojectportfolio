import { runProductHunter } from "./products";
import type { WalmartRequest, WalmartResponse } from "@/lib/schemas/walmart";

export async function runWalmartAgent(
  request: WalmartRequest,
): Promise<WalmartResponse> {
  return runProductHunter("walmart", request);
}
