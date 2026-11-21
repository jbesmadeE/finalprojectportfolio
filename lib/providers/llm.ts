import { llmConfigured, providerMode, type ProviderMode } from "@/lib/env";

export interface LLMCompleteInput {
  system: string;
  prompt: string;
}

export interface LLMProvider {
  complete(input: LLMCompleteInput): Promise<string>;
}

export class MockLLMProvider implements LLMProvider {
  async complete(input: LLMCompleteInput): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return `[mock LLM] ${input.prompt}`.slice(0, 280);
  }
}

export function getLLMProvider(): { mode: ProviderMode; provider: LLMProvider } {
  return { mode: providerMode(llmConfigured), provider: new MockLLMProvider() };
}
