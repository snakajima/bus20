/**
 * Pinned schema identifiers. Every persisted document names its schema so
 * that later protocol revisions cannot be mixed with v1 results by accident.
 */
export const PROTOCOL_VERSION = "bus20-protocol/1" as const;
export const MAP_SCHEMA_VERSION = "bus20-map/1" as const;
export const SCENARIO_SCHEMA_VERSION = "bus20-scenario/1" as const;
export const OBSERVATION_SCHEMA_VERSION = "bus20-observation/1" as const;
export const ACTION_SCHEMA_VERSION = "bus20-action/1" as const;
export const RUN_LOG_SCHEMA_VERSION = "bus20-run-log/1" as const;
export const RUN_RESULT_SCHEMA_VERSION = "bus20-run-result/1" as const;
export const MANIFEST_SCHEMA_VERSION = "bus20-manifest/1" as const;
export const SUITE_INDEX_SCHEMA_VERSION = "bus20-suite-index/1" as const;
export const POLICY_PROGRAM_SCHEMA_VERSION = "bus20-policy-program/1" as const;
export const CAMPAIGN_SCHEMA_VERSION = "bus20-campaign/1" as const;
export const EXPERIMENT_SCHEMA_VERSION = "bus20-experiment/1" as const;
