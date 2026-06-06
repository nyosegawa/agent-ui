import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createCodexAppServerBridge, type CodexChildProcess } from "../src/bridge";

describe("createCodexAppServerBridge", () => {
  it("spawns codex app-server over stdio and shuts down safely", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const writes: string[] = [];
    stdin.on("data", (chunk) => writes.push(String(chunk)));

    let killed = false;
    const fakeProcess: CodexChildProcess = {
      get killed() {
        return killed;
      },
      kill() {
        killed = true;
        return true;
      },
      stderr,
      stdin,
      stdout,
    };

    const bridge = createCodexAppServerBridge({
      initialize: {
        capabilities: {
          experimentalApi: false,
          requestAttestation: false,
        },
        clientInfo: {
          name: "agent_ui_test",
          title: "Agent UI Test",
          version: "0.0.0",
        },
      },
      spawn(command, args) {
        expect(command).toBe("codex");
        expect(args).toEqual(["app-server", "--listen", "stdio://"]);
        return fakeProcess;
      },
    });

    const connected = bridge.transport.connect();
    await waitFor(() => writes.length > 0);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;
    await bridge.close();

    expect(writes.some((line) => line.includes('"method":"initialized"'))).toBe(true);
    expect(killed).toBe(true);
  });

  it("passes cwd and env to the spawn callback", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const fakeProcess: CodexChildProcess = {
      kill: () => true,
      stdin,
      stdout,
    };

    const bridge = createCodexAppServerBridge({
      cwd: "/tmp/agent-ui-project",
      env: { AGENT_UI_TEST: "1" },
      spawn(_command, _args, options) {
        expect(options).toEqual({
          cwd: "/tmp/agent-ui-project",
          env: { AGENT_UI_TEST: "1" },
        });
        return fakeProcess;
      },
    });

    await bridge.close();
  });

  it("redacts stderr for callbacks and transport events", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const callbackMessages: string[] = [];
    const fakeProcess: CodexChildProcess = {
      kill: () => true,
      stderr,
      stdin,
      stdout,
    };

    const bridge = createCodexAppServerBridge({
      spawn: () => fakeProcess,
      stderr(line) {
        callbackMessages.push(line);
      },
    });
    await bridge.transport.connect();

    stderr.write("Authorization: Bearer raw.token OPENAI_API_KEY=sk-raw userCode=ABCD-EFGH\n");
    const event = await nextTransportEvent(bridge.transport.events, "stderr");

    expect(callbackMessages.join("")).toContain("Authorization: [REDACTED]");
    expect(callbackMessages.join("")).not.toContain("raw.token");
    expect(event.message).toContain("Authorization: [REDACTED]");
    expect(event.message).not.toContain("sk-raw");
    expect(event.message).not.toContain("ABCD-EFGH");
    await bridge.close();
  });

  it("redacts bearer tokens split across stderr chunks", async () => {
    const { bridge, callbackMessages, stderr } = createBridgeWithStderrCallback();
    await bridge.transport.connect();

    stderr.write("Authorization: Bearer raw.");
    stderr.write("secret\n");
    const event = await nextTransportEvent(bridge.transport.events, "stderr");

    expect(callbackMessages.join("")).toContain("Authorization: [REDACTED]");
    expect(callbackMessages.join("")).not.toContain("raw.secret");
    expect(callbackMessages.join("")).not.toContain("secret\n");
    expect(event.message).toContain("Authorization: [REDACTED]");
    expect(event.message).not.toContain("raw.secret");
    expect(event.message).not.toContain("secret\n");
    await bridge.close();
  });

  it("redacts API keys split across stderr chunks", async () => {
    const { bridge, callbackMessages, stderr } = createBridgeWithStderrCallback();
    await bridge.transport.connect();

    stderr.write("OPENAI_API_KEY=sk-");
    stderr.write("raw\n");
    const event = await nextTransportEvent(bridge.transport.events, "stderr");

    expect(callbackMessages.join("")).toContain("OPENAI_API_KEY=[REDACTED]");
    expect(callbackMessages.join("")).not.toContain("sk-raw");
    expect(callbackMessages.join("")).not.toContain("raw\n");
    expect(event.message).toContain("OPENAI_API_KEY=[REDACTED]");
    expect(event.message).not.toContain("sk-raw");
    expect(event.message).not.toContain("raw\n");
    await bridge.close();
  });

  it("waits after SIGTERM and escalates child shutdown after the grace period", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const signals: Array<NodeJS.Signals | string | number | undefined> = [];
    const fakeProcess: CodexChildProcess = {
      kill(signal) {
        signals.push(signal);
        return true;
      },
      once: () => undefined,
      stderr: new PassThrough(),
      stdin,
      stdout,
    };

    const bridge = createCodexAppServerBridge({
      shutdown: { graceMs: 1 },
      spawn: () => fakeProcess,
    });
    await bridge.transport.connect();
    await bridge.close();

    expect(signals).toEqual(["SIGTERM", "SIGKILL"]);
  });

  it("ends transport stdin and rejects pending requests before terminating the child", async () => {
    const operations: string[] = [];
    const stdin = new TrackingStdin(() => operations.push("stdin.end"));
    const stdout = new PassThrough();
    const fakeProcess: CodexChildProcess = {
      kill(signal) {
        operations.push(String(signal));
        return true;
      },
      stderr: new PassThrough(),
      stdin,
      stdout,
    };
    const bridge = createCodexAppServerBridge({
      spawn: () => fakeProcess,
    });
    await bridge.transport.connect();

    const pending = bridge.transport.request("thread/read", { threadId: "thread-1" });
    await bridge.close();

    await expect(pending).rejects.toThrow("Codex stdio transport closed");
    expect(operations).toEqual(["stdin.end", "SIGTERM"]);
  });
});

function createBridgeWithStderrCallback() {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const callbackMessages: string[] = [];
  const fakeProcess: CodexChildProcess = {
    kill: () => true,
    stderr,
    stdin,
    stdout,
  };
  const bridge = createCodexAppServerBridge({
    spawn: () => fakeProcess,
    stderr(line) {
      callbackMessages.push(line);
    },
  });
  return { bridge, callbackMessages, stderr };
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > 1000) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function nextTransportEvent<T extends { type: string }>(
  events: AsyncIterable<T>,
  type: T["type"],
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timed out")), 1000),
  );
  const next = (async () => {
    for await (const event of events) {
      if (event.type === type) return event;
    }
    throw new Error("transport closed");
  })();
  return Promise.race([next, timeout]);
}

class TrackingStdin extends PassThrough {
  constructor(private readonly onEnd: () => void) {
    super();
  }

  override end(...args: Parameters<PassThrough["end"]>): ReturnType<PassThrough["end"]> {
    this.onEnd();
    return super.end(...args);
  }
}
