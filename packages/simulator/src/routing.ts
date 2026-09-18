import { type MapDocument, type MapEdge } from "@bus20/contracts/map";
import { buildGraph, type Graph } from "@bus20/graph/graph";
import { pathEdgesTo, type ShortestPathTree, shortestPathsFrom } from "@bus20/graph/shortest-path";

/**
 * Memoised shortest-path queries on the fixed map. Deterministic: the same
 * (from, to) always yields the same travel time and the same first edge.
 */
export class Routing {
  private readonly graph: Graph;
  private readonly trees = new Map<string, ShortestPathTree>();

  constructor(map: MapDocument) {
    this.graph = buildGraph(map);
  }

  stopAllowed(nodeId: string): boolean {
    return this.graph.nodes.get(nodeId)?.stopAllowed === true;
  }

  hasNode(nodeId: string): boolean {
    return this.graph.nodes.has(nodeId);
  }

  travelTimeMs(fromNodeId: string, toNodeId: string): number | undefined {
    return this.tree(fromNodeId).distanceMs.get(toNodeId);
  }

  /** First edge of the shortest path, or undefined when already there or unreachable. */
  firstEdge(fromNodeId: string, toNodeId: string): MapEdge | undefined {
    return pathEdgesTo(this.tree(fromNodeId), toNodeId)?.[0];
  }

  private tree(fromNodeId: string): ShortestPathTree {
    const cached = this.trees.get(fromNodeId);
    if (cached !== undefined) {
      return cached;
    }
    const tree = shortestPathsFrom(this.graph, fromNodeId);
    this.trees.set(fromNodeId, tree);
    return tree;
  }
}
