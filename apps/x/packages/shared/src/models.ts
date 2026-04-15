import { z } from "zod";

export const LlmProvider = z.object({
  flavor: z.enum([
    "openai",
    "anthropic",
    "google",
    "openrouter",
    "aigateway",
    "ollama",
    "openai-compatible",
    "bedrock",
    "bedrock-anthropic",
  ]),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  // AWS Bedrock credentials (used when flavor is "bedrock" or "bedrock-anthropic").
  // All optional: if omitted, the SDK falls back to environment variables
  // (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
  // or the AWS credential provider chain (instance profile, ECS task role, etc.).
  awsRegion: z.string().optional(),
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsSessionToken: z.string().optional(),
});

export const LlmModelConfig = z.object({
  provider: LlmProvider,
  model: z.string(),
  models: z.array(z.string()).optional(),
  knowledgeGraphModel: z.string().optional(),
  meetingNotesModel: z.string().optional(),
});
