import { digestDocument } from "@bus20/contracts/digest";
import {
  DEMAND_PATTERNS,
  type DemandPattern,
  type DataSplit,
  type LoadLevel,
} from "@bus20/contracts/manifest";
import { type MapDocument, type MapNode } from "@bus20/contracts/map";
import { type RideRequest, type ScenarioDocument } from "@bus20/contracts/scenario";
import { MS_PER_MINUTE } from "@bus20/contracts/time";
import { SCENARIO_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { buildGraph } from "@bus20/graph/graph";
import { shortestPathsFrom, travelTimeTo } from "@bus20/graph/shortest-path";
import { createRng, type Rng, seedFromLabel } from "@bus20/contracts/random";

export const GENERATOR_NAME = "bus20-synthetic-demand" as const;
export const GENERATOR_VERSION = "1" as const;

export interface DemandSpec {
  readonly scenarioId: string;
  readonly city: string;
  readonly load: LoadLevel;
  readonly pattern: DemandPattern;
  readonly split: DataSplit;
  readonly seed: number;
  readonly vehicleCount: number;
  readonly capacity: number;
  readonly demandMinutes: number;
  readonly deadlineMarginMinutes: number;
  /** Fraction of fleet-time the direct trips alone would occupy. */
  readonly targetUtilization: number;
  /** Hotspot pattern parameters; defaults reproduce generator version 1 demand. */
  readonly hotspot?: HotspotSpec;
}

export interface HotspotSpec {
  /** Share of requests that originate in the hotspot cluster during the burst. */
  readonly share: number;
  /** Burst window as fractions of the demand period. */
  readonly burstStart: number;
  readonly burstEnd: number;
}

export const DEFAULT_HOTSPOT: HotspotSpec = { share: 0.5, burstStart: 0.4, burstEnd: 0.55 };

const DIRECT_SAMPLE_PAIRS = 200;
const COMMUTE_SHARE = 0.7;
const CENTER_FRACTION = 0.2;
const HOTSPOT_FRACTION = 0.1;

const stopNodes = (map: MapDocument): MapNode[] => map.nodes.filter((node) => node.stopAllowed);

/** Mean shortest direct travel time over a seeded sample of distinct pairs. */
export const meanDirectTravelMs = (map: MapDocument, rng: Rng): number => {
  const graph = buildGraph(map);
  const nodes = stopNodes(map);
  let total = 0;
  let count = 0;
  for (let i = 0; i < DIRECT_SAMPLE_PAIRS; i += 1) {
    const from = rng.pick(nodes);
    const to = rng.pick(nodes);
    const timeMs =
      from.id === to.id ? undefined : travelTimeTo(shortestPathsFrom(graph, from.id), to.id);
    if (timeMs !== undefined) {
      total += timeMs;
      count += 1;
    }
  }
  return count === 0 ? 0 : total / count;
};

const squaredDistance = (left: MapNode, right: MapNode): number =>
  ((left.lat ?? 0) - (right.lat ?? 0)) ** 2 + ((left.lon ?? 0) - (right.lon ?? 0)) ** 2;

const centroid = (nodes: readonly MapNode[]): MapNode => ({
  id: "centroid",
  stopAllowed: false,
  lat: nodes.reduce((sum, node) => sum + (node.lat ?? 0), 0) / nodes.length,
  lon: nodes.reduce((sum, node) => sum + (node.lon ?? 0), 0) / nodes.length,
});

const nearest = (nodes: readonly MapNode[], anchor: MapNode, fraction: number): MapNode[] =>
  [...nodes]
    .sort((left, right) => squaredDistance(left, anchor) - squaredDistance(right, anchor))
    .slice(0, Math.max(1, Math.round(nodes.length * fraction)));

interface Zones {
  readonly all: readonly MapNode[];
  readonly center: readonly MapNode[];
  readonly outer: readonly MapNode[];
  readonly hotspot: readonly MapNode[];
}

const zonesOf = (map: MapDocument, rng: Rng): Zones => {
  const all = stopNodes(map);
  const center = nearest(all, centroid(all), CENTER_FRACTION);
  const centerIds = new Set(center.map((node) => node.id));
  const outer = all.filter((node) => !centerIds.has(node.id));
  const hotspot = nearest(all, rng.pick(all), HOTSPOT_FRACTION);
  return { all, center, outer: outer.length > 0 ? outer : all, hotspot };
};

interface Draw {
  readonly origin: MapNode;
  readonly destination: MapNode;
  readonly timeMs: number;
}

const distinctPair = (
  rng: Rng,
  origins: readonly MapNode[],
  destinations: readonly MapNode[],
): [MapNode, MapNode] => {
  for (;;) {
    const origin = rng.pick(origins);
    const destination = rng.pick(destinations);
    if (origin.id !== destination.id) {
      return [origin, destination];
    }
  }
};

const drawUniform = (rng: Rng, zones: Zones, demandEndMs: number): Draw => {
  const [origin, destination] = distinctPair(rng, zones.all, zones.all);
  return { origin, destination, timeMs: rng.int(demandEndMs + 1) };
};

const drawCommute = (rng: Rng, zones: Zones, demandEndMs: number): Draw => {
  if (rng.next() >= COMMUTE_SHARE) {
    return drawUniform(rng, zones, demandEndMs);
  }
  const [origin, destination] = distinctPair(rng, zones.outer, zones.center);
  return { origin, destination, timeMs: rng.int(Math.floor(demandEndMs / 2) + 1) };
};

const drawHotspot = (rng: Rng, zones: Zones, demandEndMs: number, hotspot: HotspotSpec): Draw => {
  if (rng.next() >= hotspot.share) {
    return drawUniform(rng, zones, demandEndMs);
  }
  const [origin, destination] = distinctPair(rng, zones.hotspot, zones.all);
  const start = Math.floor(demandEndMs * hotspot.burstStart);
  const end = Math.floor(demandEndMs * hotspot.burstEnd);
  return { origin, destination, timeMs: start + rng.int(end - start + 1) };
};

type Drawer = (rng: Rng, zones: Zones, demandEndMs: number, hotspot: HotspotSpec) => Draw;

const DRAWS: Record<DemandPattern, Drawer> = {
  uniform: drawUniform,
  commute: drawCommute,
  hotspot: drawHotspot,
};

const requestCountFor = (spec: DemandSpec, meanDirectMs: number): number => {
  const fleetMs = spec.vehicleCount * spec.demandMinutes * MS_PER_MINUTE;
  return Math.max(1, Math.round((spec.targetUtilization * fleetMs) / meanDirectMs));
};

const toRequests = (draws: readonly Draw[]): RideRequest[] => {
  const width = String(draws.length).length;
  return [...draws]
    .sort((left, right) => left.timeMs - right.timeMs)
    .map((draw, index) => ({
      id: `r${String(index + 1).padStart(width, "0")}`,
      requestTimeMs: draw.timeMs,
      originNodeId: draw.origin.id,
      destinationNodeId: draw.destination.id,
      passengers: 1,
    }));
};

/**
 * Generates a fixed request sequence for one map. Everything is derived from
 * the spec's seed; the resulting document is stored, and the seed alone is
 * never a substitute for the stored requests.
 */
const provenanceOf = (spec: DemandSpec, meanDirectMs: number): Record<string, string> => ({
  generator: GENERATOR_NAME,
  generatorVersion: GENERATOR_VERSION,
  seed: String(spec.seed),
  city: spec.city,
  load: spec.load,
  pattern: spec.pattern,
  split: spec.split,
  targetUtilization: String(spec.targetUtilization),
  meanDirectMinutes: (meanDirectMs / MS_PER_MINUTE).toFixed(3),
  // Only configured hotspots are recorded, so version-1 documents rebuild byte for byte.
  ...(spec.hotspot === undefined
    ? {}
    : {
        hotspotShare: String(spec.hotspot.share),
        hotspotBurst: `${spec.hotspot.burstStart}-${spec.hotspot.burstEnd}`,
      }),
});

const drawVehicles = (rng: Rng, zones: Zones, spec: DemandSpec) =>
  Array.from({ length: spec.vehicleCount }, (_, index) => ({
    id: `v${index + 1}`,
    nodeId: rng.pick(zones.all).id,
    capacity: spec.capacity,
  }));

const drawRequests = (
  rng: Rng,
  zones: Zones,
  demandEndMs: number,
  spec: DemandSpec,
  count: number,
): Draw[] => {
  const hotspot = spec.hotspot ?? DEFAULT_HOTSPOT;
  return Array.from({ length: count }, () => DRAWS[spec.pattern](rng, zones, demandEndMs, hotspot));
};

export const generateScenario = (map: MapDocument, spec: DemandSpec): ScenarioDocument => {
  const rng = createRng(spec.seed);
  // Seeded by the map, not the scenario, so every scenario in a cell gets the same count.
  const meanDirectMs = meanDirectTravelMs(map, createRng(seedFromLabel(0, `direct:${map.id}`)));
  const zones = zonesOf(map, rng);
  const demandEndMs = spec.demandMinutes * MS_PER_MINUTE;
  const draws = drawRequests(rng, zones, demandEndMs, spec, requestCountFor(spec, meanDirectMs));
  return {
    schemaVersion: SCENARIO_SCHEMA_VERSION,
    id: spec.scenarioId,
    map: { id: map.id, digest: digestDocument(map) },
    startTimeMs: 0,
    demandEndTimeMs: demandEndMs,
    completionDeadlineMs: demandEndMs + spec.deadlineMarginMinutes * MS_PER_MINUTE,
    vehicles: drawVehicles(rng, zones, spec),
    requests: toRequests(draws),
    provenance: provenanceOf(spec, meanDirectMs),
  };
};

/**
 * The generative distribution behind a stored scenario, recovered from its
 * provenance. It identifies the pattern and the seeded zones, never the
 * stored requests: fresh draws from it are other days with the same
 * structure. Undefined when the scenario was not produced by this generator.
 */
export interface DemandDistribution {
  readonly pattern: DemandPattern;
  readonly seed: number;
  readonly hotspot: HotspotSpec;
  readonly demandEndTimeMs: number;
  /** Draws per day; fixed per (map, load) cell, so it reveals nothing about one day's requests. */
  readonly requestCount: number;
}

const patternOf = (value: string | undefined): DemandPattern | undefined =>
  DEMAND_PATTERNS.find((pattern) => pattern === value);

const hotspotOf = (provenance: Record<string, string>): HotspotSpec | undefined => {
  const share = Number(provenance["hotspotShare"]);
  const [start, end] = (provenance["hotspotBurst"] ?? "").split("-").map(Number);
  if (provenance["hotspotShare"] === undefined) {
    return DEFAULT_HOTSPOT;
  }
  return Number.isFinite(share) && start !== undefined && end !== undefined && start < end
    ? { share, burstStart: start, burstEnd: end }
    : undefined;
};

export const demandDistributionOf = (
  scenario: ScenarioDocument,
): DemandDistribution | undefined => {
  const provenance = scenario.provenance ?? {};
  const pattern = patternOf(provenance["pattern"]);
  const seed = Number(provenance["seed"]);
  const hotspot = hotspotOf(provenance);
  const usable = provenance["generator"] === GENERATOR_NAME && Number.isInteger(seed);
  if (!usable || pattern === undefined || hotspot === undefined) {
    return undefined;
  }
  return {
    pattern,
    seed,
    hotspot,
    demandEndTimeMs: scenario.demandEndTimeMs,
    requestCount: scenario.requests.length,
  };
};

export interface DemandDraw {
  readonly requestTimeMs: number;
  readonly originNodeId: string;
  readonly destinationNodeId: string;
}

/** One fresh day of demand from the distribution, in release order, drawn with `rng`. */
export const sampleDemandDay = (
  map: MapDocument,
  distribution: DemandDistribution,
  rng: Rng,
): DemandDraw[] => {
  const zones = zonesOf(map, createRng(distribution.seed));
  const draw = DRAWS[distribution.pattern];
  return Array.from({ length: distribution.requestCount }, () =>
    draw(rng, zones, distribution.demandEndTimeMs, distribution.hotspot),
  )
    .sort((left, right) => left.timeMs - right.timeMs)
    .map((item) => ({
      requestTimeMs: item.timeMs,
      originNodeId: item.origin.id,
      destinationNodeId: item.destination.id,
    }));
};
