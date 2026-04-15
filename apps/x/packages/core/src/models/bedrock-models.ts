// Static catalog of Anthropic models available on AWS Bedrock.
//
// models.dev (used by models-dev.ts) does not track Bedrock-specific model
// IDs, so we ship a curated list here.
//
// Model ID prefixes:
//   - "global." — cross-region inference profile that routes across all
//     commercial regions (US, EU, APAC); highest availability.
//   - "us."     — cross-region profile scoped to US commercial regions;
//     use this instead if you need US-only data residency.
//   - no prefix — single-region model, must be invoked in the region where
//     it is deployed.

export type BedrockModelEntry = {
    id: string;
    name: string;
    release_date?: string;
};

/**
 * Curated list of Anthropic Claude models available on AWS Bedrock.
 *
 * Ordered newest-first so the onboarding picker defaults to the latest.
 */
export const BEDROCK_ANTHROPIC_MODELS: BedrockModelEntry[] = [
    {
        id: "global.anthropic.claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        release_date: "2026-02-05",
    },
    {
        id: "global.anthropic.claude-opus-4-6-v1",
        name: "Claude Opus 4.6",
        release_date: "2026-02-05",
    },
    {
        id: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
        name: "Claude Haiku 4.5",
        release_date: "2025-10-01",
    },
    {
        id: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
        name: "Claude Sonnet 4.5",
        release_date: "2025-09-29",
    },
    {
        id: "us.anthropic.claude-opus-4-1-20250805-v1:0",
        name: "Claude Opus 4.1",
        release_date: "2025-08-05",
    },
    {
        id: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        name: "Claude Sonnet 4",
        release_date: "2025-05-14",
    },
    {
        id: "us.anthropic.claude-opus-4-20250514-v1:0",
        name: "Claude Opus 4",
        release_date: "2025-05-14",
    },
    {
        id: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        name: "Claude 3.5 Sonnet v2",
        release_date: "2024-10-22",
    },
    {
        id: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
        name: "Claude 3.5 Haiku",
        release_date: "2024-10-22",
    },
    {
        id: "us.anthropic.claude-3-opus-20240229-v1:0",
        name: "Claude 3 Opus",
        release_date: "2024-02-29",
    },
];

