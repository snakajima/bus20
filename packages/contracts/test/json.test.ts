import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { sortIds } from "../src/ids.js";
import { parseJsonText, parseJsonWithSchema } from "../src/json.js";
import { formatIssues } from "../src/result.js";

const schema = z.object({ count: z.int(), name: z.string() });

test("parseJsonText reports malformed JSON as an issue", () => {
  const result = parseJsonText("{not json");
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0]?.path, "");
});

test("parseJsonWithSchema returns typed values or per-field issues", () => {
  const good = parseJsonWithSchema(schema, '{"count": 3, "name": "x"}');
  assert.deepEqual(good, { ok: true, value: { count: 3, name: "x" } });

  const bad = parseJsonWithSchema(schema, '{"count": 1.5}');
  assert.equal(bad.ok, false);
  const paths = sortIds(bad.issues.map((item) => item.path));
  assert.deepEqual(paths, ["count", "name"]);
  assert.match(formatIssues(bad.issues), /^count: /m);
});
