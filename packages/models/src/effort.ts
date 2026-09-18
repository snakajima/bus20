/**
 * Reasoning effort shared by the general-LLM adapters. Both Anthropic and
 * OpenAI accept these names; each adapter maps them to its own request field.
 * Pilots default to low; experiments set effort explicitly and always record it.
 */
export const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORT_LEVELS)[number];
export const DEFAULT_EFFORT: Effort = "low";
