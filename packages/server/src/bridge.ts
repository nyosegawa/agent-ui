import { createCodexStdioTransport, type CodexInitializeOptions } from "@nyosegawa/agent-ui-codex";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { execa } from "execa";
import { redactSecrets } from "./redaction";

export interface CodexAppServerBridgeOptions {
  args?: string[];
  command?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  initialize?: CodexInitializeOptions;
  stderr?: (line: string) => void;
}

export interface CodexAppServerBridge {
  close(): Promise<void>;
  process: ReturnType<typeof execa>;
  transport: AgentTransport;
}

export function createCodexAppServerBridge(
  options: CodexAppServerBridgeOptions = {},
): CodexAppServerBridge {
  const child = execa(options.command ?? "codex", options.args ?? ["app-server", "--listen", "stdio://"], {
    cwd: options.cwd,
    env: options.env,
    stderr: "pipe",
    stdin: "pipe",
    stdout: "pipe",
  });

  if (!child.stdin || !child.stdout) {
    throw new Error("Codex app-server stdio streams were not created");
  }

  if (child.stderr && options.stderr) {
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => options.stderr?.(redactSecrets(String(chunk))));
  }

  const transport = createCodexStdioTransport({
    initialize: options.initialize,
    stderr: child.stderr ?? undefined,
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
