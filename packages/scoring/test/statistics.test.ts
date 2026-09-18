import assert from "node:assert/strict";
import { test } from "node:test";
import { maximum, mean, percentileNearestRank } from "../src/statistics.js";

test("mean, maximum, and nearest-rank percentiles", () => {
  const values = [5, 1, 4, 2, 3];
  assert.equal(mean(values), 3);
  assert.equal(maximum(values), 5);
  assert.equal(percentileNearestRank(values, 0.5), 3);
  assert.equal(percentileNearestRank(values, 0.95), 5);
  assert.equal(percentileNearestRank(values, 0.01), 1);
  assert.equal(percentileNearestRank([], 0.95), 0);
  assert.equal(mean([]), 0);
});
