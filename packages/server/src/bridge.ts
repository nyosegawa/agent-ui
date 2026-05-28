import { createCodexStdioTransport, type CodexInitializeOptions } from "@nyosegawa/agent-ui-codex";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { execa } from "execa";
import { PassThrough, type Readable, type Writable } from "node:stream";
import { redactSecrets } from "./redaction";

export interface CodexAppServerBridgeOptions {
  args?: string[];
  command?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  initialize?: CodexInitializeOptions;
  shutdown?: CodexBridgeShutdownOptions;
  spawn?: (command: string, args: string[], options: CodexSpawnOptions) => CodexChildProcess;
  stderr?: (line: string) => void;
}

export interface CodexBridgeShutdownOptions {
  graceMs?: number;
  killSignal?: NodeJS.Signals | string;
  terminateSignal?: NodeJS.Signals | string;
}

export interface CodexSpawnOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface CodexChildProcess {
  killed?: boolean;
  stderr?: Readable | null;
  stdin?: Writable | null;
  stdout?: Readable | null;
  kill(signal?: NodeJS.Signals | string | number, error?: Error): boolean;
  once?: (event: "exit" | "close", listener: () => void) => unknown;
}

export interface CodexAppServerBridge {
  close(): Promise<void>;
  process: CodexChildProcess;
  transport: AgentTransport;
}

export function createCodexAppServerBridge(
  options: CodexAppServerBridgeOptions = {},
): CodexAppServerBridge {
  const command = options.command ?? "codex";
  const args = options.args ?? ["app-server", "--listen", "stdio://"];
  const child =
    options.spawn?.(command, args, { cwd: options.cwd, env: options.env }) ??
    execa(command, args, {
      ...(options.cwd ? { cwd: options.cwd } : {}),
      ...(options.env ? { env: options.env } : {}),
      stderr: "pipe",
      stdin: "pipe",
      stdout: "pipe",
    });

  if (!child.stdin || !child.stdout) {
    throw new Error("Codex app-server stdio streams were not created");
  }

  const childPromise = child as unknown as { catch?: (handler: (error: unknown) => void) => void };
  childPromise.catch?.(() => undefined);

  const stderr = child.stderr ? createRedactedStderr(child.stderr, options.stderr) : undefined;

  const transport = createCodexStdioTransport({
    initialize: options.initialize,
    stderr,
    stdin: child.stdin,
    stdout: child.stdout,
  });

  return {
    async close() {
      await transport.close();
      await shutdownChild(child, options.shutdown);
    },
    process: child,
    transport,
  };
}

async function shutdownChild(
  child: CodexChildProcess,
  options: CodexBridgeShutdownOptions = {},
): Promise<void> {
  if (child.killed) return;
  const terminateSignal = options.terminateSignal ?? "SIGTERM";
  const killSignal = options.killSignal ?? "SIGKILL";
  const graceMs = options.graceMs ?? 2_000;
  const exited = waitForChildExit(child);
  child.kill(terminateSignal);
  const finished = await Promise.race([
    exited.then(() => true),
    delay(graceMs).then(() => false),
  ]);
  if (!finished && !child.killed) {
    child.kill(killSignal);
    await Promise.race([exited, delay(250)]);
  }
}

function waitForChildExit(child: CodexChildProcess): Promise<void> {
  const thenable = child as unknown as PromiseLike<unknown>;
  if (typeof thenable.then === "function") {
    return Promise.resolve(thenable).then(
      () => undefined,
      () => undefined,
    );
  }
  if (typeof child.once === "function") {
    return new Promise((resolve) => {
      child.once?.("exit", resolve);
      child.once?.("close", resolve);
    });
  }
  return Promise.resolve();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRedactedStderr(
  raw: Readable,
  onStderr?: (line: string) => void,
): Readable {
  const redacted = new PassThrough();
  const maxCarryChars = 8192;
  const retainedCarryChars = 4096;
  let carry = "";
  const flush = (text: string) => {
    if (!text) return;
    const safeText = redactSecrets(text);
    onStderr?.(safeText);
    redacted.write(safeText);
  };
  raw.setEncoding("utf8");
  raw.on("data", (chunk) => {
    carry += String(chunk);
    let newlineIndex = carry.search(/\r?\n/);
    while (newlineIndex >= 0) {
      const lineEnd = carry[newlineIndex] === "\r" && carry[newlineIndex + 1] === "\n"
        ? newlineIndex + 2
        : newlineIndex + 1;
      flush(carry.slice(0, lineEnd));
      carry = carry.slice(lineEnd);
      newlineIndex = carry.search(/\r?\n/);
    }
    if (carry.length > maxCarryChars) {
      const flushLength = carry.length - retainedCarryChars;
      flush(carry.slice(0, flushLength));
      carry = carry.slice(flushLength);
    }
  });
  raw.on("end", () => {
    flush(carry);
    carry = "";
    redacted.end();
  });
  raw.on("error", (error) => redacted.destroy(error));
  return redacted;
}
