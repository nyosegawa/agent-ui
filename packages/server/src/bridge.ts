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
  spawn?: (command: string, args: string[], options: CodexSpawnOptions) => CodexChildProcess;
  stderr?: (line: string) => void;
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
      if (!child.killed) child.kill("SIGTERM");
    },
    process: child,
    transport,
  };
}

function createRedactedStderr(
  raw: Readable,
  onStderr?: (line: string) => void,
): Readable {
  const redacted = new PassThrough();
  raw.setEncoding("utf8");
  raw.on("data", (chunk) => {
    const text = redactSecrets(String(chunk));
    onStderr?.(text);
    redacted.write(text);
  });
  raw.on("end", () => redacted.end());
  raw.on("error", (error) => redacted.destroy(error));
  return redacted;
}
