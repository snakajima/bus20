/**
 * Fake JSON Lines CLI for transport tests. Mode comes from argv[2]:
 *   echo     - answers every line with {"type":"echo","line":<line>}
 *   crash    - exits with code 3 after the first line
 *   silent   - never answers
 *   garbage  - answers with a non-JSON line
 */
import { createInterface } from "node:readline";

const mode = process.argv[2] ?? "echo";
createInterface({ input: process.stdin }).on("line", (line) => {
  if (mode === "crash") {
    process.stderr.write("fake cli crashed\n");
    process.exit(3);
  }
  if (mode === "silent") {
    return;
  }
  if (mode === "garbage") {
    process.stdout.write("not json\n");
    return;
  }
  process.stdout.write(`${JSON.stringify({ type: "echo", line })}\n`);
});
