import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
});

type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
});

if (env.LLM_PROVIDER === "openai" && !env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required when LLM_PROVIDER is 'openai'");
}
