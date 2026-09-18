import { z } from "zod";
import { findDuplicateIds } from "./ids.js";
import { validateWithSchema } from "./json.js";
import { fail, issue, type Issue, ok, type Result } from "./result.js";
import { MAP_SCHEMA_VERSION } from "./versions.js";

const idSchema = z.string().min(1);

export const mapNodeSchema = z.object({
  id: idSchema,
  /** Whether passengers may board or alight here. Coordinates are metadata only. */
  stopAllowed: z.boolean(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

export const mapEdgeSchema = z.object({
  id: idSchema,
  from: idSchema,
  to: idSchema,
  travelTimeMs: z.int().positive(),
  lengthMeters: z.number().nonnegative().optional(),
});

export const mapSourceSchema = z.object({
  provider: z.string().min(1),
  attribution: z.string().min(1),
  license: z.string().min(1),
  retrievedAt: z.string().min(1).optional(),
  notes: z.string().optional(),
});

/** Directed road graph. Fixed travel times, protocol v1. */
export const mapDocumentSchema = z.object({
  schemaVersion: z.literal(MAP_SCHEMA_VERSION),
  id: idSchema,
  nodes: z.array(mapNodeSchema).min(1),
  edges: z.array(mapEdgeSchema).min(1),
  source: mapSourceSchema.optional(),
});

export type MapNode = z.infer<typeof mapNodeSchema>;
export type MapEdge = z.infer<typeof mapEdgeSchema>;
export type MapDocument = z.infer<typeof mapDocumentSchema>;

const checkUniqueIds = (kind: string, ids: readonly string[]): Issue[] =>
  findDuplicateIds(ids).map((id) => issue(kind, `duplicate ${kind} id "${id}"`));

const checkEdgeEndpoints = (map: MapDocument): Issue[] => {
  const nodeIds = new Set(map.nodes.map((node) => node.id));
  const issues: Issue[] = [];
  map.edges.forEach((edge, index) => {
    if (!nodeIds.has(edge.from)) {
      issues.push(issue(`edges.${index}.from`, `unknown node "${edge.from}"`));
    }
    if (!nodeIds.has(edge.to)) {
      issues.push(issue(`edges.${index}.to`, `unknown node "${edge.to}"`));
    }
    if (edge.from === edge.to) {
      issues.push(issue(`edges.${index}`, `self-loop edge "${edge.id}"`));
    }
  });
  return issues;
};

/** Semantic checks beyond the JSON shape: unique IDs and valid endpoints. */
export const checkMapSemantics = (map: MapDocument): Issue[] => [
  ...checkUniqueIds(
    "nodes",
    map.nodes.map((node) => node.id),
  ),
  ...checkUniqueIds(
    "edges",
    map.edges.map((edge) => edge.id),
  ),
  ...checkEdgeEndpoints(map),
];

export const validateMapDocument = (value: unknown): Result<MapDocument> => {
  const parsed = validateWithSchema(mapDocumentSchema, value);
  if (!parsed.ok) {
    return parsed;
  }
  const issues = checkMapSemantics(parsed.value);
  return issues.length === 0 ? ok(parsed.value) : fail(issues);
};
