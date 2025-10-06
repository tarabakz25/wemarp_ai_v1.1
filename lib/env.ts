import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  OPENAI_API_KEY: z.string(),
  OPENAI_API_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  // Optional OpenAI scoping headers
  OPENAI_ORG: z.string().optional(),
  OPENAI_PROJECT: z.string().optional(),
  // Client resilience
  OPENAI_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  OPENAI_RETRY_BASE_MS: z.coerce.number().int().min(50).max(10000).default(250),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(60000),
});

type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_ORG: process.env.OPENAI_ORG,
  OPENAI_PROJECT: process.env.OPENAI_PROJECT,
  OPENAI_MAX_RETRIES: process.env.OPENAI_MAX_RETRIES,
  OPENAI_RETRY_BASE_MS: process.env.OPENAI_RETRY_BASE_MS,
  OPENAI_TIMEOUT_MS: process.env.OPENAI_TIMEOUT_MS,
});
