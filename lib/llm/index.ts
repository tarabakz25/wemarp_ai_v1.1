import type { LLMClient } from "@/lib/llm/types"; 
import { env } from "@/lib/env";
import { OpenAIClient } from "@/lib/llm/providers/openai";

let _client: LLMClient | null = null;

export const getLLMClient(): LLMClient {
  if (_client) return _client;
  switch (env.LLM_PROVIDER) {
    case "openai":
      _client = new OpenAIClient();
      break;
  }
};
