/**
 * LLM provider adapter. The real implementation (Stage 4) wraps the
 * `ai` package against the OpenAI-compatible gateway in lib/env.ts.
 * Mock mode is the fallback whenever OPENAI_API_KEY is unset.
 */
import { env, llmConfigured, providerMode, type ProviderMode } from "@/lib/env";

export interface LLMCompleteInput {
  system: string;
  prompt: string;
}

export interface LLMProvider {
  complete(input: LLMCompleteInput): Promise<string>;
}

/** Deterministic canned response for offline/dev work. */
export class MockLLMProvider implements LLMProvider {
  async complete(input: LLMCompleteInput): Promise<string> {
    // Keep a tiny delay so UI loading states are exercisable in dev.
    await new Promise((resolve) => setTimeout(resolve, 250));
    return `[mock LLM] ${input.prompt}`.slice(0, 280);
  }
}

export function getLLMProvider(): { mode: ProviderMode; provider: LLMProvider } {
  const mode = providerMode(llmConfigured);
  if (mode === "real") {
    // TODO(Stage 4): build the real provider on `ai` + @ai-sdk/openai-compatible
    // using env.OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL.
  }
  return { mode, provider: new MockLLMProvider() };
}

export { env as llmEnv };
