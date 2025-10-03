import { env } from "@/lib/env";
import type { LLMClient, GenerateInput, GenerateResult } from "@/lib/llm/type";

type OpenAIChatChoice = {
  index: number;
  message: { role: string; content: string };
  finish_reason?: string;
};

type OpenAIChatResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChatChoice[];
  usage?: Record<string, number>;
};

export class OpenAIClient implements LLMClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = env.OPENAI_API_KEY!;
    this.baseUrl = env.OPENAI_API_BASE_URL ?? "https://api.openai.com/v1";
    this.model = env.OPENAI_MODEL;
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "user",
            content: input.userInput
              ? `${input.instruction}\n\n${input.userInput}`
              : input.instruction,
          },
        ],
        max_tokens: input.maxTokens ?? 1024,
        temperature: input.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      let message = `${response.status} ${response.statusText}`;
      try {
        const errJson: any = await response.json();
        if (errJson?.error?.message) message += ` - ${errJson.error.message}`;
      } catch {}
      throw new Error(`OpenAI API error: ${message}`);
    }

    const json = (await response.json()) as OpenAIChatResponse;
    const choice = json.choices?.[0];
    const text = choice?.message?.content ?? "";
    const finishReason = choice?.finish_reason;

    return {
      text,
      finishReason,
      provider: "openai",
      model: this.model,
      usage: json.usage as Record<string, number | string> | undefined,
    };
  }
}
