import { compareIds } from "@bus20/contracts/ids";
import { type MapDocument, type MapEdge, type MapNode } from "@bus20/contracts/map";

/** Adjacency view of a validated map. Edge lists are sorted for determinism. */
export interface Graph {
  readonly nodes: ReadonlyMap<string, MapNode>;
  readonly edges: ReadonlyMap<string, MapEdge>;
  readonly outgoing: ReadonlyMap<string, readonly MapEdge[]>;
}

const compareEdges = (left: MapEdge, right: MapEdge): number =>
  compareIds(left.to, right.to) || compareIds(left.id, right.id);

export const buildGraph = (map: MapDocument): Graph => {
  const nodes = new Map(map.nodes.map((node) => [node.id, node]));
  const edges = new Map(map.edges.map((edge) => [edge.id, edge]));
  const outgoing = new Map<string, MapEdge[]>(map.nodes.map((node) => [node.id, []]));
  for (const edge of map.edges) {
    outgoing.get(edge.from)?.push(edge);
  }
  for (const list of outgoing.values()) {
    list.sort(compareEdges);
  }
  return { nodes, edges, outgoing };
};
