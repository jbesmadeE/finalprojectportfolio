import { runProductHunter } from "./products";
import type { AmazonRequest, AmazonResponse } from "@/lib/schemas/amazon";

export async function runAmazonAgent(
  request: AmazonRequest,
): Promise<AmazonResponse> {
  return runProductHunter("amazon", request);
}
