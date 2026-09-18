import assert from "node:assert/strict";
import { test } from "node:test";
import { validateMapDocument } from "../src/map.js";
import { asArray, asObject, loadGridMap, mutatedClone } from "./fixtures.js";

const withMutation = (mutate: (doc: Record<string, unknown>) => void): unknown =>
  mutatedClone(loadGridMap(), mutate);

const issueMessages = (value: unknown): string[] => {
  const result = validateMapDocument(value);
  return result.ok ? [] : result.issues.map((item) => `${item.path}: ${item.message}`);
};

test("fixture map validates", () => {
  const result = validateMapDocument(loadGridMap());
  assert.equal(result.ok, true);
  assert.equal(result.value.nodes.length, 9);
  assert.equal(result.value.edges.length, 24);
});

test("map rejects wrong schema version and non-positive travel times", () => {
  const wrongVersion = withMutation((doc) => {
    doc["schemaVersion"] = "bus20-map/2";
  });
  assert.ok(issueMessages(wrongVersion).length > 0);
  const zeroTime = withMutation((doc) => {
    const edges = asArray(doc["edges"]);
    edges[0] = { ...asObject(edges[0]), travelTimeMs: 0 };
  });
  assert.match(issueMessages(zeroTime).join("\n"), /edges\.0\.travelTimeMs/);
});

test("map rejects duplicate ids, unknown endpoints, and self-loops", () => {
  const duplicated = withMutation((doc) => {
    const nodes = asArray(doc["nodes"]);
    nodes.push({ ...asObject(nodes[0]) });
  });
  assert.match(issueMessages(duplicated).join("\n"), /duplicate nodes id "n00"/);

  const dangling = withMutation((doc) => {
    const edges = asArray(doc["edges"]);
    edges.push({ id: "bad", from: "n00", to: "nope", travelTimeMs: 1 });
    edges.push({ id: "loop", from: "n00", to: "n00", travelTimeMs: 1 });
  });
  const messages = issueMessages(dangling).join("\n");
  assert.match(messages, /edges\.24\.to: unknown node "nope"/);
  assert.match(messages, /self-loop edge "loop"/);
});
