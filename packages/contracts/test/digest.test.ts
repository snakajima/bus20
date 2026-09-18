import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalJson, digestDocument } from "../src/digest.js";
import { loadGridMap, loadSmokeScenario } from "./fixtures.js";

test("canonicalJson ignores key order, whitespace, and undefined members", () => {
  const left = canonicalJson({ b: [1, { z: 1, y: undefined }], a: "x" });
  const right = canonicalJson({ a: "x", b: [1, { y: undefined, z: 1 }] });
  assert.equal(left, right);
  assert.equal(left, '{"a":"x","b":[1,{"z":1}]}');
});

test("digestDocument is stable and prefixed", () => {
  assert.equal(digestDocument({ a: 1, b: 2 }), digestDocument({ b: 2, a: 1 }));
  assert.notEqual(digestDocument({ a: 1 }), digestDocument({ a: 2 }));
  assert.match(digestDocument({}), /^sha256:[0-9a-f]{64}$/);
});

test("smoke scenario references the fixture map by content digest", () => {
  assert.equal(loadSmokeScenario().map.digest, digestDocument(loadGridMap()));
});
