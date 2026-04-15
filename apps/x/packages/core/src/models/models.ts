import { ProviderV2 } from "@ai-sdk/provider";
import { createGateway, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider-v2";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createBedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';
import { LlmModelConfig, LlmProvider } from "@x/shared/dist/models.js";
import z from "zod";
import { isSignedIn } from "../account/account.js";
import { getGatewayProvider } from "./gateway.js";

export const Provider = LlmProvider;
export const ModelConfig = LlmModelConfig;

export function createProvider(config: z.infer<typeof Provider>): ProviderV2 {
    const { apiKey, baseURL, headers } = config;
    switch (config.flavor) {
        case "openai":
            return createOpenAI({
                apiKey,
                baseURL,
                headers,
            });
        case "aigateway":
            return createGateway({
                apiKey,
                baseURL,
                headers,
            });
        case "anthropic":
            return createAnthropic({
                apiKey,
                baseURL,
                headers,
            });
        case "google":
            return createGoogleGenerativeAI({
                apiKey,
                baseURL,
                headers,
            });
        case "ollama": {
            // ollama-ai-provider-v2 expects baseURL to include /api
            let ollamaURL = baseURL;
            if (ollamaURL && !ollamaURL.replace(/\/+$/, '').endsWith('/api')) {
                ollamaURL = ollamaURL.replace(/\/+$/, '') + '/api';
            }
            return createOllama({
                baseURL: ollamaURL,
                headers,
            });
        }
        case "openai-compatible":
            return createOpenAICompatible({
                name: "openai-compatible",
                apiKey,
                baseURL: baseURL || "",
                headers,
            });
        case "openrouter":
            return createOpenRouter({
                apiKey,
                baseURL,
                headers,
            }) as unknown as ProviderV2;
        case "bedrock":
            return createAmazonBedrock(buildBedrockConfig(config)) as unknown as ProviderV2;
        case "bedrock-anthropic":
            return createBedrockAnthropic(buildBedrockConfig(config)) as unknown as ProviderV2;
        default:
            throw new Error(`Unsupported provider flavor: ${config.flavor}`);
    }
}

/**
 * Resolve Bedrock credentials from the provider config, with fallback to
 * environment variables. Fields are always set explicitly (including
 * `undefined`) so the underlying SDK does not merge stale credentials from
 * unrelated env vars in serverless runtimes.
 */
function buildBedrockConfig(config: z.infer<typeof Provider>): {
    region: string;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    sessionToken: string | undefined;
    baseURL: string | undefined;
    headers: Record<string, string> | undefined;
} {
    return {
        region:
            config.awsRegion ||
            process.env.AWS_REGION ||
            process.env.AWS_DEFAULT_REGION ||
            "us-east-1",
        accessKeyId: config.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID || undefined,
        secretAccessKey:
            config.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || undefined,
        sessionToken: config.awsSessionToken || process.env.AWS_SESSION_TOKEN || undefined,
        baseURL: config.baseURL || undefined,
        headers: config.headers || undefined,
    };
}

/**
 * Map a raw Bedrock SDK error message to a human-friendly explanation.
 * Returns null if the message is not a recognised Bedrock error.
 */
function mapBedrockError(message: string): string | null {
    if (message.includes("UnrecognizedClientException") || message.includes("InvalidSignatureException")) {
        return "AWS credentials are invalid. Check your Access Key ID and Secret Access Key.";
    }
    if (message.includes("AccessDeniedException")) {
        return "Access denied. Ensure your IAM principal has the AmazonBedrockFullAccess policy, and that you have requested access to this model in the Bedrock console (Model access → Manage model access).";
    }
    if (message.includes("ResourceNotFoundException") || message.includes("ValidationException")) {
        return 'Model not found or not available in this region. Verify the model ID and region. Cross-region inference profile IDs start with "us." (e.g. us.anthropic.claude-sonnet-4-5-20250929-v1:0).';
    }
    if (message.includes("ThrottlingException")) {
        return "Bedrock request throttled. Try again in a moment or request a service quota increase.";
    }
    if (message.includes("Could not load credentials") || message.includes("CredentialsProviderError")) {
        return "No AWS credentials found. Set AWS credentials in the provider config, via AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY environment variables, or use an instance profile.";
    }
    return null;
}

export async function testModelConnection(
    providerConfig: z.infer<typeof Provider>,
    model: string,
    timeoutMs?: number,
): Promise<{ success: boolean; error?: string }> {
    const isLocal = providerConfig.flavor === "ollama" || providerConfig.flavor === "openai-compatible";
    const effectiveTimeout = timeoutMs ?? (isLocal ? 60000 : 8000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), effectiveTimeout);
    try {
        const provider = await isSignedIn()
            ? await getGatewayProvider()
            : createProvider(providerConfig);
        const languageModel = provider.languageModel(model);
        await generateText({
            model: languageModel,
            prompt: "ping",
            abortSignal: controller.signal,
        });
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Connection test failed";
        if (
            providerConfig.flavor === "bedrock" ||
            providerConfig.flavor === "bedrock-anthropic"
        ) {
            const friendly = mapBedrockError(message);
            if (friendly) {
                return { success: false, error: friendly };
            }
        }
        return { success: false, error: message };
    } finally {
        clearTimeout(timeout);
    }
}
