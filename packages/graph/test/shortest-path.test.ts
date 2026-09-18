import { sortIds } from "@bus20/contracts/ids";
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGraph } from "../src/graph.js";
import {
  pathEdgesTo,
  reachableFrom,
  shortestPathsFrom,
  travelTimeTo,
} from "../src/shortest-path.js";
import { loadGridMap, makeMap } from "./fixtures.js";

test("grid distances combine 60 s horizontal and 90 s vertical edges", () => {
  const tree = shortestPathsFrom(buildGraph(loadGridMap()), "n00");
  assert.equal(travelTimeTo(tree, "n00"), 0);
  assert.equal(travelTimeTo(tree, "n02"), 120000);
  assert.equal(travelTimeTo(tree, "n20"), 180000);
  assert.equal(travelTimeTo(tree, "n22"), 300000);
  assert.equal(
    pathEdgesTo(tree, "n02")
      ?.map((edge) => edge.id)
      .join(" "),
    "e-n00-n01 e-n01-n02",
  );
});

test("unreachable nodes have no distance and no path", () => {
  const map = makeMap([
    ["a-b", "a", "b", 10],
    ["c-a", "c", "a", 10],
  ]);
  const tree = shortestPathsFrom(buildGraph(map), "a");
  assert.equal(travelTimeTo(tree, "c"), undefined);
  assert.equal(pathEdgesTo(tree, "c"), undefined);
  assert.deepEqual(sortIds([...reachableFrom(buildGraph(map), "a")]), ["a", "b"]);
  assert.deepEqual(sortIds([...reachableFrom(buildGraph(map), "c")]), ["a", "b", "c"]);
});

test("equal-length paths resolve to the lexically smaller final edge id, regardless of input order", () => {
  const edges = [
    ["z-top", "s", "m1", 5],
    ["m1-t", "m1", "t", 5],
    ["a-low", "s", "m2", 5],
    ["m2-t", "m2", "t", 5],
  ] as const;
  const forward = shortestPathsFrom(buildGraph(makeMap(edges)), "s");
  const reversed = shortestPathsFrom(buildGraph(makeMap([...edges].reverse())), "s");
  assert.equal(travelTimeTo(forward, "t"), 10);
  const forwardIds = pathEdgesTo(forward, "t")?.map((edge) => edge.id);
  const reversedIds = pathEdgesTo(reversed, "t")?.map((edge) => edge.id);
  assert.deepEqual(forwardIds, ["z-top", "m1-t"]);
  assert.deepEqual(reversedIds, forwardIds);
});

test("Dijkstra takes the cheaper multi-hop route over a direct expensive edge", () => {
  const map = makeMap([
    ["direct", "a", "c", 100],
    ["a-b", "a", "b", 30],
    ["b-c", "b", "c", 30],
  ]);
  const tree = shortestPathsFrom(buildGraph(map), "a");
  assert.equal(travelTimeTo(tree, "c"), 60);
  assert.deepEqual(
    pathEdgesTo(tree, "c")?.map((edge) => edge.id),
    ["a-b", "b-c"],
  );
});
