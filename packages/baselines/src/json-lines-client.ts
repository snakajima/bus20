import { spawn, type ChildProcessByStdio } from "node:child_process";
import { type Readable, type Writable } from "node:stream";
import { createInterface } from "node:readline";

export interface JsonLinesClientOptions {
  readonly command: string;
  readonly args?: readonly string[];
  /** Per-request timeout; the process is treated as failed when it elapses. */
  readonly timeoutMs: number;
}

interface Pending {
  readonly resolve: (line: string) => void;
  readonly reject: (error: Error) => void;
  readonly timer: NodeJS.Timeout;
}

type Child = ChildProcessByStdio<Writable, Readable, Readable>;

/**
 * One long-lived child process speaking JSON Lines: one request line in,
 * one response line out, strictly in order. All process I/O lives here so
 * policies stay free of transport concerns.
 */
export class JsonLinesClient {
  private readonly child: Child;
  private readonly queue: Pending[] = [];
  private failure: Error | undefined;
  private stderrTail = "";

  constructor(private readonly options: JsonLinesClientOptions) {
    this.child = spawn(options.command, [...(options.args ?? [])], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    createInterface({ input: this.child.stdout }).on("line", (line) => {
      this.deliver(line);
    });
    this.child.stderr.on("data", (chunk: Buffer) => {
      this.stderrTail = `${this.stderrTail}${chunk.toString("utf8")}`.slice(-2000);
    });
    this.child.on("error", (error) => {
      this.fail(new Error(`${options.command}: ${error.message}`));
    });
    this.child.on("exit", (code, signal) => {
      this.fail(
        new Error(`${options.command} exited (code ${code}, signal ${signal}) ${this.stderrTail}`),
      );
    });
  }

  /** Sends one line and resolves with the next response line. */
  request(line: string): Promise<string> {
    if (this.failure !== undefined) {
      return Promise.reject(this.failure);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.fail(
          new Error(`${this.options.command}: no response within ${this.options.timeoutMs} ms`),
        );
      }, this.options.timeoutMs);
      this.queue.push({ resolve, reject, timer });
      this.child.stdin.write(`${line}\n`);
    });
  }

  close(): void {
    this.child.stdin.end();
    this.child.kill();
  }

  private deliver(line: string): void {
    const pending = this.queue.shift();
    if (pending === undefined) {
      this.fail(new Error(`${this.options.command}: unexpected output ${line}`));
      return;
    }
    clearTimeout(pending.timer);
    pending.resolve(line);
  }

  private fail(error: Error): void {
    if (this.failure !== undefined) {
      return;
    }
    this.failure = error;
    for (const pending of this.queue.splice(0)) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.child.kill();
  }
}
