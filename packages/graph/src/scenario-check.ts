import { digestDocument } from "@bus20/contracts/digest";
import { type MapDocument } from "@bus20/contracts/map";
import { type Issue, issue } from "@bus20/contracts/result";
import { type RideRequest, type ScenarioDocument } from "@bus20/contracts/scenario";
import { buildGraph, type Graph } from "./graph.js";
import { reachableFrom } from "./shortest-path.js";

const checkStopNode = (graph: Graph, path: string, nodeId: string): Issue[] => {
  const node = graph.nodes.get(nodeId);
  if (node === undefined) {
    return [issue(path, `unknown node "${nodeId}"`)];
  }
  return node.stopAllowed ? [] : [issue(path, `node "${nodeId}" does not allow stops`)];
};

const checkVehicleNodes = (graph: Graph, scenario: ScenarioDocument): Issue[] =>
  scenario.vehicles.flatMap((vehicle, index) =>
    graph.nodes.has(vehicle.nodeId)
      ? []
      : [issue(`vehicles.${index}.nodeId`, `unknown node "${vehicle.nodeId}"`)],
  );

const checkRequestReachability = (
  graph: Graph,
  vehicleReach: readonly ReadonlySet<string>[],
  request: RideRequest,
  path: string,
): Issue[] => {
  const issues: Issue[] = [];
  if (!vehicleReach.every((reach) => reach.has(request.originNodeId))) {
    issues.push(
      issue(path, `origin "${request.originNodeId}" is not reachable from every vehicle`),
    );
  }
  if (!reachableFrom(graph, request.originNodeId).has(request.destinationNodeId)) {
    issues.push(
      issue(path, `destination "${request.destinationNodeId}" is not reachable from origin`),
    );
  }
  return issues;
};

const checkRequests = (graph: Graph, scenario: ScenarioDocument): Issue[] => {
  const vehicleReach = scenario.vehicles
    .filter((vehicle) => graph.nodes.has(vehicle.nodeId))
    .map((vehicle) => reachableFrom(graph, vehicle.nodeId));
  return scenario.requests.flatMap((request, index) => {
    const path = `requests.${index}`;
    const nodeIssues = [
      ...checkStopNode(graph, `${path}.originNodeId`, request.originNodeId),
      ...checkStopNode(graph, `${path}.destinationNodeId`, request.destinationNodeId),
    ];
    return nodeIssues.length > 0
      ? nodeIssues
      : checkRequestReachability(graph, vehicleReach, request, path);
  });
};

const checkMapReference = (scenario: ScenarioDocument, map: MapDocument): Issue[] => {
  const issues: Issue[] = [];
  if (scenario.map.id !== map.id) {
    issues.push(issue("map.id", `scenario expects map "${scenario.map.id}", got "${map.id}"`));
  }
  const digest = digestDocument(map);
  if (scenario.map.digest !== digest) {
    issues.push(issue("map.digest", `scenario expects ${scenario.map.digest}, map is ${digest}`));
  }
  return issues;
};

/**
 * Cross-document checks from protocol v1: the scenario names this exact map,
 * every stop node exists and allows stops, every origin is reachable from
 * every initial vehicle, and every destination is reachable from its origin.
 */
export const checkScenarioOnMap = (scenario: ScenarioDocument, map: MapDocument): Issue[] => {
  const graph = buildGraph(map);
  return [
    ...checkMapReference(scenario, map),
    ...checkVehicleNodes(graph, scenario),
    ...checkRequests(graph, scenario),
  ];
};
