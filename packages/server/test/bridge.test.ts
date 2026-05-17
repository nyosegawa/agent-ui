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

    expect(callbackMessages.join("")).toContain("Authorization: Bearer [REDACTED]");
    expect(callbackMessages.join("")).not.toContain("raw.token");
    expect(event.message).toContain("OPENAI_API_KEY=[REDACTED]");
    expect(event.message).toContain("userCode=[REDACTED]");
    expect(event.message).not.toContain("sk-raw");
    expect(event.message).not.toContain("ABCD-EFGH");
    await bridge.close();
  });
});

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
