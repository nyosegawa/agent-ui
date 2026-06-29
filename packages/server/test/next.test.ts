import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createAgentUiNextRpcRoute } from "../src";
import { agentUiServerInternalBridgeOptions } from "../src/bridge";
import type { CodexChildProcess } from "../src/advanced";

describe("createAgentUiNextRpcRoute", () => {
  it("handles an allowed productized request and closes the App Server process", async () => {
    const child = createFakeChildProcess();
    const route = createAgentUiNextRpcRoute(testBridgeOptions(() => child.process));
    const responsePromise = route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "model/list", params: {} }),
        method: "POST",
      }),
    );

    await waitFor(() =>
      child.writes.some((line) => JSON.parse(line).method === "model/list"),
    );
    const request = child.writes
      .map((line) => JSON.parse(line))
      .find((line) => line.method === "model/list");
    child.stdout.write(`${JSON.stringify({ id: request.id, result: { data: [] } })}\n`);

    await expect(responsePromise.then((response) => response.json())).resolves.toEqual({
      result: { data: [] },
    });
    expect(child.killed()).toBe(true);
  });

  it("redacts App Server JSON-RPC errors before returning one-shot responses", async () => {
    const child = createFakeChildProcess();
    const route = createAgentUiNextRpcRoute(testBridgeOptions(() => child.process));
    const responsePromise = route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "model/list", params: {} }),
        method: "POST",
      }),
    );

    await waitFor(() =>
      child.writes.some((line) => JSON.parse(line).method === "model/list"),
    );
    const request = child.writes
      .map((line) => JSON.parse(line))
      .find((line) => line.method === "model/list");
    child.stdout.write(
      `${JSON.stringify({
        error: {
          code: -32042,
          data: { apiKey: "sk-route", retryAfterMs: 250 },
          message: "failed token: next-secret",
        },
        id: request.id,
      })}\n`,
    );

    const response = await responsePromise;
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: -32042,
        data: { apiKey: "[REDACTED]", retryAfterMs: 250 },
        message: "failed token: [REDACTED]",
      },
    });
    expect(JSON.stringify(body)).not.toContain("next-secret");
    expect(JSON.stringify(body)).not.toContain("sk-route");
  });

  it("redacts startup failures before returning one-shot responses", async () => {
    const route = createAgentUiNextRpcRoute(
      testBridgeOptions(() => {
        throw new Error("missing binary token: next-spawn-secret");
      }),
    );
    const response = await route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "model/list", params: {} }),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).toContain("[REDACTED]");
    expect(JSON.stringify(body)).not.toContain("next-spawn-secret");
  });

  it("cleans up partial child state when stdio streams are missing", async () => {
    const child = createFakeChildProcess();
    const route = createAgentUiNextRpcRoute(
      testBridgeOptions(() => ({ ...child.process, stdin: null })),
    );
    const response = await route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "model/list", params: {} }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: "Codex app-server stdio streams were not created" },
    });
    expect(child.killed()).toBe(true);
  });

  it("rejects unsupported root process options before spawning", async () => {
    let spawnCount = 0;
    const route = createAgentUiNextRpcRoute({
      spawn: () => {
        spawnCount += 1;
        return createFakeChildProcess().process;
      },
    } as unknown as Parameters<typeof createAgentUiNextRpcRoute>[0]);

    const response = await route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "model/list", params: {} }),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).toContain(
      "Unsupported root App Server bridge option: spawn",
    );
    expect(spawnCount).toBe(0);
  });

  it("rejects host-only methods before spawning the App Server process", async () => {
    let spawnCount = 0;
    const route = createAgentUiNextRpcRoute(
      testBridgeOptions(() => {
        spawnCount += 1;
        return createFakeChildProcess().process;
      }),
    );
    const response = await route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "fs/readFile", params: { path: "/tmp/secret" } }),
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: {
        code: -32601,
        data: { method: "fs/readFile" },
        message: "Codex method is not allowed: fs/readFile",
      },
    });
    expect(response.status).toBe(403);
    expect(spawnCount).toBe(0);
  });

  it("rejects command execution by default", async () => {
    let spawnCount = 0;
    const route = createAgentUiNextRpcRoute(
      testBridgeOptions(() => {
        spawnCount += 1;
        return createFakeChildProcess().process;
      }),
    );
    const response = await route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "command/exec", params: { command: "pwd" } }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: -32601, data: { method: "command/exec" } },
    });
    expect(spawnCount).toBe(0);
  });

  it("rejects missing or invalid methods before spawning", async () => {
    let spawnCount = 0;
    const route = createAgentUiNextRpcRoute(
      testBridgeOptions(() => {
        spawnCount += 1;
        return createFakeChildProcess().process;
      }),
    );
    const response = await route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ params: {} }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: -32600,
        message: "Missing or invalid method",
      },
    });
    expect(spawnCount).toBe(0);
  });

  it("allows explicit unsafe all-method routing", async () => {
    const child = createFakeChildProcess();
    const route = createAgentUiNextRpcRoute({
      allowedMethods: "all",
      ...testBridgeOptions(() => child.process),
    });
    const responsePromise = route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "fs/readFile", params: { path: "/tmp/data" } }),
        method: "POST",
      }),
    );

    await waitFor(() =>
      child.writes.some((line) => JSON.parse(line).method === "fs/readFile"),
    );
    const request = child.writes
      .map((line) => JSON.parse(line))
      .find((line) => line.method === "fs/readFile");
    child.stdout.write(
      `${JSON.stringify({ id: request.id, result: { content: "ok" } })}\n`,
    );

    await expect(responsePromise.then((response) => response.json())).resolves.toEqual({
      result: { content: "ok" },
    });
    expect(child.killed()).toBe(true);
  });
});

function testBridgeOptions(spawn: () => CodexChildProcess) {
  return {
    [agentUiServerInternalBridgeOptions]: { spawn },
  };
}

function createFakeChildProcess(): {
  killed: () => boolean;
  process: CodexChildProcess;
  stdout: PassThrough;
  writes: string[];
} {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const writes: string[] = [];
  let killed = false;
  stdin.on("data", (chunk) => writes.push(String(chunk)));

  return {
    killed: () => killed,
    process: {
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
    },
    stdout,
    writes,
  };
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > 1000) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
