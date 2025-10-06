import { env } from "@/lib/env";
import type { LLMClient, GenerateInput, GenerateResult } from "@/lib/llm/types";

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
  private readonly maxRetries: number;
  private readonly retryBaseMs: number;
  private readonly timeoutMs: number;
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 1000; // Minimum 1 second between requests

  constructor() {
    this.apiKey = env.OPENAI_API_KEY!;
    this.baseUrl = env.OPENAI_API_BASE_URL ?? "https://api.openai.com/v1";
    this.model = env.OPENAI_MODEL;
    this.maxRetries = env.OPENAI_MAX_RETRIES;
    this.retryBaseMs = env.OPENAI_RETRY_BASE_MS;
    this.timeoutMs = env.OPENAI_TIMEOUT_MS;
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    // Rate limiting: ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.sleep(this.minRequestInterval - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const combinedContent = input.userInput
      ? `${input.instruction}\n\n${input.userInput}`
      : input.instruction;

    // Prefer Responses API for newer models (e.g. gpt-5*, gpt-4.1*, gpt-4o*)
    const shouldUseResponses = this.isResponsesModel(this.model);

    if (shouldUseResponses) {
      try {
        const json = (await this.fetchWithRetries({
          url: `${this.baseUrl}/responses`,
          body: this.buildResponsesBody({
            combinedContent,
            input,
            includeTemperature: this.isResponsesTemperatureSupported(this.model),
          }),
        })) as any;

        const { text, finishReason } = this.extractTextFromResponses(json);
        return {
          text,
          finishReason,
          provider: "openai",
          model: this.model,
          usage: json.usage as Record<string, number | string> | undefined,
        };
      } catch (err: any) {
        const msg = String(err?.message || "").toLowerCase();
        const tempUnsupported = msg.includes("unsupported parameter") && msg.includes("temperature");
        const notSupported = msg.includes("temperature") && msg.includes("not supported");
        if (!tempUnsupported && !notSupported) throw err;

        // Retry without temperature
        const json = (await this.fetchWithRetries({
          url: `${this.baseUrl}/responses`,
          body: this.buildResponsesBody({
            combinedContent,
            input,
            includeTemperature: false,
          }),
        })) as any;

        const { text, finishReason } = this.extractTextFromResponses(json);
        return {
          text,
          finishReason,
          provider: "openai",
          model: this.model,
          usage: json.usage as Record<string, number | string> | undefined,
        };
      }
    }

    // Fallback to Chat Completions API
    try {
      const json = (await this.fetchWithRetries({
        url: `${this.baseUrl}/chat/completions`,
        body: {
          model: this.model,
          messages: [
            {
              role: "user",
              content: combinedContent,
            },
          ],
          max_tokens: input.maxTokens ?? 1024,
          temperature: input.temperature ?? 0.7,
        },
      })) as OpenAIChatResponse;

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
    } catch (err: any) {
      // If the model rejects max_tokens or chat completions, retry via Responses API
      const msg = String(err?.message || "").toLowerCase();
      const isNotSupported = msg.includes("max_tokens") || msg.includes("not supported") || msg.includes("chat completions");
      if (!isNotSupported) throw err;

      const json = (await this.fetchWithRetries({
        url: `${this.baseUrl}/responses`,
        body: {
          model: this.model,
          input: combinedContent,
          max_output_tokens: input.maxTokens ?? 1024,
          temperature: input.temperature ?? 0.7,
        },
      })) as any;

      const { text, finishReason } = this.extractTextFromResponses(json);
      return {
        text,
        finishReason,
        provider: "openai",
        model: this.model,
        usage: json.usage as Record<string, number | string> | undefined,
      };
    }
  }

  private isResponsesModel(model: string): boolean {
    const lower = model.toLowerCase();
    return (
      lower.startsWith("gpt-5") ||
      lower.startsWith("gpt-4.1") ||
      lower.startsWith("gpt-4o")
    );
  }

  private isResponsesTemperatureSupported(model: string): boolean {
    const lower = model.toLowerCase();
    // Empirically: some gpt-5* models reject temperature
    if (lower.startsWith("gpt-5")) return false;
    return true;
  }

  private buildResponsesBody({
    combinedContent,
    input,
    includeTemperature,
  }: {
    combinedContent: string;
    input: GenerateInput;
    includeTemperature: boolean;
  }): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      input: combinedContent,
      max_output_tokens: input.maxTokens ?? 1024,
    };
    if (includeTemperature && typeof input.temperature === "number") {
      body.temperature = input.temperature;
    }
    return body;
  }

  private extractTextFromResponses(json: any): { text: string; finishReason?: string } {
    // Prefer the convenience field if present
    if (typeof json?.output_text === "string" && json.output_text.length > 0) {
      const finishReason = json?.stop_reason || json?.finish_reason;
      return { text: json.output_text, finishReason };
    }

    // Otherwise, try to derive text from the output array
    const output = Array.isArray(json?.output) ? json.output : [];
    for (const item of output) {
      if (item?.type === "message" && Array.isArray(item?.content)) {
        for (const piece of item.content) {
          if (typeof piece?.text === "string" && piece.text.length > 0) {
            const finishReason = json?.stop_reason || json?.finish_reason;
            return { text: piece.text, finishReason };
          }
          if (typeof piece?.output_text === "string" && piece.output_text.length > 0) {
            const finishReason = json?.stop_reason || json?.finish_reason;
            return { text: piece.output_text, finishReason };
          }
        }
      }
    }

    // Fallback to empty string
    const finishReason = json?.stop_reason || json?.finish_reason;
    return { text: "", finishReason };
  }

  private async fetchWithRetries({
    url,
    body,
  }: {
    url: string;
    body: Record<string, unknown>;
  }): Promise<unknown> {
    const controller = new AbortController();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (env.OPENAI_ORG) headers["OpenAI-Organization"] = env.OPENAI_ORG;
    if (env.OPENAI_PROJECT) headers["OpenAI-Project"] = env.OPENAI_PROJECT as string;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          return await response.json();
        }

        const isRetryable = [429, 500, 502, 503, 504].includes(response.status);
        if (!isRetryable || attempt === this.maxRetries) {
          let message = `${response.status} ${response.statusText}`;
          try {
            const errJson: any = await response.json();
            if (errJson?.error?.message) message += ` - ${errJson.error.message}`;
          } catch {}
          throw new Error(`OpenAI API error: ${message}`);
        }

        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : undefined;
        const backoffMs = retryAfterSec && !Number.isNaN(retryAfterSec)
          ? Math.max(retryAfterSec * 1000, this.retryBaseMs)
          : this.retryBaseMs * Math.pow(2, attempt);

        await this.sleep(backoffMs);
        continue;
      } catch (err: any) {
        clearTimeout(timeout);
        const isAbort = err?.name === "AbortError";
        if (!isAbort && attempt === this.maxRetries) throw err;
        const backoffMs = this.retryBaseMs * Math.pow(2, attempt);
        await this.sleep(backoffMs);
      }
    }
    throw new Error("OpenAI API error: retries exhausted");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
