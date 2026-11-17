/**
 * Provider adapter barrel. Each agent (Stage 4) imports its provider here.
 * Contract: every getXProvider() returns { mode, provider } where mode is
 * "mock" unless the relevant credential is configured — agents must handle
 * both modes.
 */
export {
  getLLMProvider,
  MockLLMProvider,
  type LLMProvider,
  type LLMCompleteInput,
} from "./llm";
export {
  getProductProvider,
  MockProductProvider,
  type ProductProvider,
  type ProductListing,
  type ProductSearchInput,
} from "./products";
export {
  getSeoProvider,
  MockSeoProvider,
  type SeoProvider,
  type SeoReport,
  type SeoCheck,
  type SeoCheckStatus,
} from "./seo";
export {
  getImageProvider,
  MockImageProvider,
  type ImageProvider,
  type ImageGenerateInput,
  type GeneratedImage,
} from "./image";
export {
  getVideoProvider,
  MockVideoProvider,
  type VideoProvider,
  type VideoJob,
  type VideoJobStatus,
} from "./video";
export type { ProviderMode } from "@/lib/env";
