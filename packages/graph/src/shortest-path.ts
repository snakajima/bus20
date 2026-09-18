import { compareIds } from "@bus20/contracts/ids";
import { type MapEdge } from "@bus20/contracts/map";
import { type Graph } from "./graph.js";
import { MinHeap } from "./heap.js";

/** Single-source shortest-path tree. Distances are integer milliseconds. */
export interface ShortestPathTree {
  readonly sourceNodeId: string;
  readonly distanceMs: ReadonlyMap<string, number>;
  readonly viaEdge: ReadonlyMap<string, MapEdge>;
}

interface QueueEntry {
  readonly nodeId: string;
  readonly distanceMs: number;
}

const compareEntries = (left: QueueEntry, right: QueueEntry): number =>
  left.distanceMs - right.distanceMs || compareIds(left.nodeId, right.nodeId);

const relax = (
  edge: MapEdge,
  fromDistance: number,
  distanceMs: Map<string, number>,
  viaEdge: Map<string, MapEdge>,
): boolean => {
  const candidate = fromDistance + edge.travelTimeMs;
  const known = distanceMs.get(edge.to);
  const better = known === undefined || candidate < known;
  const tie = known === candidate && compareIds(edge.id, viaEdge.get(edge.to)?.id ?? "") < 0;
  if (better || tie) {
    distanceMs.set(edge.to, candidate);
    viaEdge.set(edge.to, edge);
  }
  return better;
};

/**
 * Dijkstra with deterministic tie-breaking: nodes settle in (distance, ID)
 * order and equal-length paths prefer the lexically smaller final edge ID.
 */
export const shortestPathsFrom = (graph: Graph, sourceNodeId: string): ShortestPathTree => {
  const distanceMs = new Map<string, number>([[sourceNodeId, 0]]);
  const viaEdge = new Map<string, MapEdge>();
  const settled = new Set<string>();
  const queue = new MinHeap<QueueEntry>(compareEntries);
  queue.push({ nodeId: sourceNodeId, distanceMs: 0 });
  for (let entry = queue.pop(); entry !== undefined; entry = queue.pop()) {
    if (settled.has(entry.nodeId) || entry.distanceMs !== distanceMs.get(entry.nodeId)) {
      continue;
    }
    settled.add(entry.nodeId);
    for (const edge of graph.outgoing.get(entry.nodeId) ?? []) {
      if (relax(edge, entry.distanceMs, distanceMs, viaEdge)) {
        queue.push({ nodeId: edge.to, distanceMs: entry.distanceMs + edge.travelTimeMs });
      }
    }
  }
  return { sourceNodeId, distanceMs, viaEdge };
};

/** Travel time to `targetNodeId`, or undefined when unreachable. */
export const travelTimeTo = (tree: ShortestPathTree, targetNodeId: string): number | undefined =>
  tree.distanceMs.get(targetNodeId);

/** Edge sequence from the source to `targetNodeId`, or undefined when unreachable. */
export const pathEdgesTo = (
  tree: ShortestPathTree,
  targetNodeId: string,
): MapEdge[] | undefined => {
  if (!tree.distanceMs.has(targetNodeId)) {
    return undefined;
  }
  const edges: MapEdge[] = [];
  for (let node = targetNodeId; node !== tree.sourceNodeId;) {
    const edge = tree.viaEdge.get(node);
    if (edge === undefined) {
      return undefined;
    }
    edges.push(edge);
    node = edge.from;
  }
  return edges.reverse();
};

export const reachableFrom = (graph: Graph, sourceNodeId: string): ReadonlySet<string> =>
  new Set(shortestPathsFrom(graph, sourceNodeId).distanceMs.keys());
