import { type MapDocument } from "@bus20/contracts/map";
import { type RideRequest } from "@bus20/contracts/scenario";
import { buildGraph } from "@bus20/graph/graph";
import { shortestPathsFrom, travelTimeTo } from "@bus20/graph/shortest-path";

/**
 * Shortest direct travel time per request on the fixed graph. One Dijkstra
 * per distinct origin; missing entries mean the destination is unreachable.
 */
export const directTravelTimes = (
  map: MapDocument,
  requests: readonly RideRequest[],
): ReadonlyMap<string, number> => {
  const graph = buildGraph(map);
  const trees = new Map<string, ReturnType<typeof shortestPathsFrom>>();
  const result = new Map<string, number>();
  for (const request of requests) {
    const tree = trees.get(request.originNodeId) ?? shortestPathsFrom(graph, request.originNodeId);
    trees.set(request.originNodeId, tree);
    const timeMs = travelTimeTo(tree, request.destinationNodeId);
    if (timeMs !== undefined) {
      result.set(request.id, timeMs);
    }
  }
  return result;
};
