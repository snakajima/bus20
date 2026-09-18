import { z } from "zod";
import { validateWithSchema } from "./json.js";
import { findDuplicateIds } from "./ids.js";
import { fail, issue, type Issue, ok, type Result } from "./result.js";
import { MANIFEST_SCHEMA_VERSION } from "./versions.js";

const idSchema = z.string().min(1);
const digestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);

export const LOAD_LEVELS = ["low", "medium", "high"] as const;
export const DEMAND_PATTERNS = ["uniform", "commute", "hotspot"] as const;
export const DATA_SPLITS = ["dev", "validation", "test"] as const;
export const MAP_KINDS = ["synthetic", "osm"] as const;

export const loadLevelSchema = z.enum(LOAD_LEVELS);
export const demandPatternSchema = z.enum(DEMAND_PATTERNS);
export const dataSplitSchema = z.enum(DATA_SPLITS);

export const manifestMapSchema = z.object({
  id: idSchema,
  version: idSchema,
  /** Path relative to the manifest file. */
  path: z.string().min(1),
  digest: digestSchema,
  kind: z.enum(MAP_KINDS),
  city: idSchema,
});

export const manifestScenarioSchema = z.object({
  id: idSchema,
  path: z.string().min(1),
  digest: digestSchema,
  mapId: idSchema,
  city: idSchema,
  load: loadLevelSchema,
  pattern: demandPatternSchema,
  split: dataSplitSchema,
  seed: z.int().nonnegative(),
  requestCount: z.int().positive(),
  vehicleCount: z.int().positive(),
});

/**
 * A versioned benchmark suite: every map and scenario with its content
 * digest, so a result can name exactly which inputs it used.
 */
export const manifestSchema = z.object({
  schemaVersion: z.literal(MANIFEST_SCHEMA_VERSION),
  benchmarkVersion: idSchema,
  createdAt: z.string().min(1),
  generator: z.object({ name: idSchema, version: idSchema, seed: z.int().nonnegative() }),
  maps: z.array(manifestMapSchema).min(1),
  scenarios: z.array(manifestScenarioSchema).min(1),
});

export type LoadLevel = z.infer<typeof loadLevelSchema>;
export type DemandPattern = z.infer<typeof demandPatternSchema>;
export type DataSplit = z.infer<typeof dataSplitSchema>;
export type ManifestMap = z.infer<typeof manifestMapSchema>;
export type ManifestScenario = z.infer<typeof manifestScenarioSchema>;
export type Manifest = z.infer<typeof manifestSchema>;

export const checkManifestSemantics = (manifest: Manifest): Issue[] => {
  const mapIds = new Set(manifest.maps.map((map) => map.id));
  return [
    ...findDuplicateIds(manifest.maps.map((map) => map.id)).map((id) =>
      issue("maps", `duplicate map id "${id}"`),
    ),
    ...findDuplicateIds(manifest.scenarios.map((scenario) => scenario.id)).map((id) =>
      issue("scenarios", `duplicate scenario id "${id}"`),
    ),
    ...manifest.scenarios.flatMap((scenario, index) =>
      mapIds.has(scenario.mapId)
        ? []
        : [issue(`scenarios.${index}.mapId`, `unknown map "${scenario.mapId}"`)],
    ),
  ];
};

export const validateManifest = (value: unknown): Result<Manifest> => {
  const parsed = validateWithSchema(manifestSchema, value);
  if (!parsed.ok) {
    return parsed;
  }
  const issues = checkManifestSemantics(parsed.value);
  return issues.length === 0 ? ok(parsed.value) : fail(issues);
};
