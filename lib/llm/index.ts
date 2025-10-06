import type { LLMClient } from "@/lib/llm/types";
import { OpenAIClient } from "@/lib/llm/providers/openai";

let cachedClient: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (cachedClient) return cachedClient;

  // Always use OpenAI as the LLM provider
  cachedClient = new OpenAIClient();

  return cachedClient;
}
