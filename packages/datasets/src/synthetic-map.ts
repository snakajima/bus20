import { type MapDocument, type MapEdge, type MapNode } from "@bus20/contracts/map";
import { MAP_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { buildGraph } from "@bus20/graph/graph";
import { reachableFrom } from "@bus20/graph/shortest-path";
import { createRng, type Rng } from "@bus20/contracts/random";

/** Parameters of a synthetic, city-like grid map. */
export interface SyntheticMapSpec {
  readonly id: string;
  readonly city: string;
  readonly width: number;
  readonly height: number;
  /** Nominal block length in metres. */
  readonly blockMeters: number;
  /** Fraction of grid cells removed to make the street pattern irregular. */
  readonly removeFraction: number;
  /** Fraction of two-way streets turned one-way. */
  readonly oneWayFraction: number;
  /** Speeds in metres per second; one is drawn per street. */
  readonly speedsMps: readonly number[];
  readonly originLat: number;
  readonly originLon: number;
  readonly seed: number;
}

const METERS_PER_DEGREE_LAT = 111_320;
const MS_PER_SECOND = 1000;

interface Cell {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

const cellId = (x: number, y: number): string => `n${y}-${x}`;

const keptCells = (spec: SyntheticMapSpec, rng: Rng): Cell[] => {
  const cells: Cell[] = [];
  for (let y = 0; y < spec.height; y += 1) {
    for (let x = 0; x < spec.width; x += 1) {
      if (rng.next() >= spec.removeFraction) {
        cells.push({ id: cellId(x, y), x, y });
      }
    }
  }
  return cells;
};

const toNode = (spec: SyntheticMapSpec, rng: Rng, cell: Cell): MapNode => {
  const jitter = (): number => (rng.next() - 0.5) * 0.3;
  const metersEast = (cell.x + jitter()) * spec.blockMeters;
  const metersNorth = (cell.y + jitter()) * spec.blockMeters;
  const lat = spec.originLat + metersNorth / METERS_PER_DEGREE_LAT;
  const lonScale = METERS_PER_DEGREE_LAT * Math.cos((spec.originLat * Math.PI) / 180);
  return { id: cell.id, stopAllowed: true, lat, lon: spec.originLon + metersEast / lonScale };
};

const distanceMeters = (from: MapNode, to: MapNode): number => {
  const dLat = ((to.lat ?? 0) - (from.lat ?? 0)) * METERS_PER_DEGREE_LAT;
  const meanLat = (((to.lat ?? 0) + (from.lat ?? 0)) / 2) * (Math.PI / 180);
  const dLon = ((to.lon ?? 0) - (from.lon ?? 0)) * METERS_PER_DEGREE_LAT * Math.cos(meanLat);
  return Math.hypot(dLat, dLon);
};

const directedEdge = (
  tail: MapNode,
  head: MapNode,
  travelTimeMs: number,
  lengthMeters: number,
): MapEdge => ({
  id: `${tail.id}>${head.id}`,
  from: tail.id,
  to: head.id,
  travelTimeMs,
  lengthMeters,
});

const streetEdges = (spec: SyntheticMapSpec, rng: Rng, from: MapNode, to: MapNode): MapEdge[] => {
  const length = distanceMeters(from, to);
  const speed = rng.pick(spec.speedsMps);
  const travelTimeMs = Math.max(1, Math.round((length / speed) * MS_PER_SECOND));
  const forward = directedEdge(from, to, travelTimeMs, Math.round(length));
  const backward = directedEdge(to, from, travelTimeMs, Math.round(length));
  if (rng.next() < spec.oneWayFraction) {
    return [rng.next() < 0.5 ? forward : backward];
  }
  return [forward, backward];
};

const gridEdges = (spec: SyntheticMapSpec, rng: Rng, nodes: readonly MapNode[]): MapEdge[] => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: MapEdge[] = [];
  for (const node of nodes) {
    const [, y, x] = /^n(\d+)-(\d+)$/.exec(node.id) ?? [];
    const east = byId.get(cellId(Number(x) + 1, Number(y)));
    const north = byId.get(cellId(Number(x), Number(y) + 1));
    for (const neighbour of [east, north]) {
      if (neighbour !== undefined) {
        edges.push(...streetEdges(spec, rng, node, neighbour));
      }
    }
  }
  return edges;
};

const isStronglyConnected = (map: MapDocument): boolean => {
  const graph = buildGraph(map);
  const [first] = map.nodes;
  if (first === undefined) {
    return false;
  }
  if (reachableFrom(graph, first.id).size !== map.nodes.length) {
    return false;
  }
  const reversed: MapDocument = {
    ...map,
    edges: map.edges.map((edge) => ({ ...edge, from: edge.to, to: edge.from })),
  };
  return reachableFrom(buildGraph(reversed), first.id).size === map.nodes.length;
};

const reversedMap = (map: MapDocument): MapDocument => ({
  ...map,
  edges: map.edges.map((edge) => ({ ...edge, from: edge.to, to: edge.from })),
});

const largestComponentIds = (map: MapDocument): ReadonlySet<string> => {
  const graph = buildGraph(map);
  const reversed = buildGraph(reversedMap(map));
  let best: ReadonlySet<string> = new Set();
  for (const node of map.nodes) {
    if (best.has(node.id)) {
      continue;
    }
    const forward = reachableFrom(graph, node.id);
    const component = new Set(
      [...reachableFrom(reversed, node.id)].filter((id) => forward.has(id)),
    );
    best = component.size > best.size ? component : best;
  }
  return best;
};

/** Largest strongly connected component is kept; everything else is dropped. */
const largestComponent = (map: MapDocument): MapDocument => {
  const keep = largestComponentIds(map);
  return {
    ...map,
    nodes: map.nodes.filter((node) => keep.has(node.id)),
    edges: map.edges.filter((edge) => keep.has(edge.from) && keep.has(edge.to)),
  };
};

const MAX_ATTEMPTS = 20;

/**
 * Builds a strongly connected, irregular grid with mixed one-way streets.
 * Deterministic in the spec; the same spec always yields the same map.
 */
const attemptMap = (spec: SyntheticMapSpec, attempt: number): MapDocument => {
  const rng = createRng(spec.seed + attempt);
  const nodes = keptCells(spec, rng).map((cell) => toNode(spec, rng, cell));
  return largestComponent({
    schemaVersion: MAP_SCHEMA_VERSION,
    id: spec.id,
    nodes,
    edges: gridEdges(spec, rng, nodes),
    source: {
      provider: "synthetic",
      attribution: `Bus 2.0 synthetic city "${spec.city}" (generated, not derived from OpenStreetMap)`,
      license: "CC-BY-NC-SA-4.0",
      notes: `grid ${spec.width}x${spec.height}, block ${spec.blockMeters} m, seed ${spec.seed}, attempt ${attempt}`,
    },
  });
};

export const generateSyntheticMap = (spec: SyntheticMapSpec): MapDocument => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const map = attemptMap(spec, attempt);
    if (map.nodes.length >= (spec.width * spec.height) / 2 && isStronglyConnected(map)) {
      return map;
    }
  }
  throw new Error(`could not build a connected synthetic map for "${spec.id}"`);
};
