export type GenerateInput = {
  instruction: string;
  userInput?: string;
  maxTokens?: number;
  temperature?: number;
}

export type GenerateResult = {
  text: string;
  finishReason?: string;
  provider: "openai";
  model: string;
  usage?: Record<string, number | string>;
}

export type LLMClient = {
  generate(input: GenerateInput): Promise<GenerateResult>;
}

