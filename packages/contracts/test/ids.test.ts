import assert from "node:assert/strict";
import { test } from "node:test";
import { compareIds, findDuplicateIds, sortIds } from "../src/ids.js";

test("compareIds orders by code point, independent of locale", () => {
  assert.equal(compareIds("B", "a"), -1);
  assert.equal(compareIds("a", "B"), 1);
  assert.equal(compareIds("r10", "r9"), -1);
  assert.equal(compareIds("same", "same"), 0);
  assert.deepEqual(sortIds(["r9", "r10", "R1"]), ["R1", "r10", "r9"]);
});

test("findDuplicateIds reports each duplicate once, sorted", () => {
  assert.deepEqual(findDuplicateIds(["b", "a", "b", "c", "a", "b"]), ["a", "b"]);
  assert.deepEqual(findDuplicateIds(["x"]), []);
});
