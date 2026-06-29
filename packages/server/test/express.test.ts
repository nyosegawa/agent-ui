import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createAgentUiExpressMiddleware, type MinimalExpressResponse } from "../src";
import { agentUiServerInternalBridgeOptions } from "../src/bridge";
import type { CodexChildProcess } from "../src/advanced";

describe("createAgentUiExpressMiddleware", () => {
  it("handles an allowed productized request and closes the App Server process", async () => {
    const child = createFakeChildProcess();
    const middleware = createAgentUiExpressMiddleware(
      testBridgeOptions(() => child.process),
    );
    const response = createResponse();
    const pending = middleware({ body: { method: "model/list", params: {} } }, response);

    await waitFor(() =>
      child.writes.some((line) => JSON.parse(line).method === "model/list"),
    );
    const request = child.writes
      .map((line) => JSON.parse(line))
      .find((line) => line.method === "model/list");
    child.stdout.write(`${JSON.stringify({ id: request.id, result: { data: [] } })}\n`);
    await pending;

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ result: { data: [] } });
    expect(child.killed()).toBe(true);
  });

  it("redacts App Server JSON-RPC errors before returning middleware responses", async () => {
    const child = createFakeChildProcess();
    const middleware = createAgentUiExpressMiddleware(
      testBridgeOptions(() => child.process),
    );
    const response = createResponse();
    const pending = middleware({ body: { method: "model/list", params: {} } }, response);

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
          data: { password: "express-password", retryAfterMs: 250 },
          message: "failed token: express-secret",
        },
        id: request.id,
      })}\n`,
    );
    await pending;

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: -32042,
        data: { password: "[REDACTED]", retryAfterMs: 250 },
        message: "failed token: [REDACTED]",
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("express-secret");
    expect(JSON.stringify(response.body)).not.toContain("express-password");
  });

  it("redacts spawn startup failures before returning middleware responses", async () => {
    const middleware = createAgentUiExpressMiddleware(
      testBridgeOptions(() => {
        throw new Error("missing binary token: express-spawn-secret");
      }),
    );
    const response = createResponse();

    await middleware({ body: { method: "model/list", params: {} } }, response);

    expect(response.statusCode).toBe(500);
    expect(JSON.stringify(response.body)).toContain("[REDACTED]");
    expect(JSON.stringify(response.body)).not.toContain("express-spawn-secret");
  });

  it("returns generic startup failures when stdio streams are missing", async () => {
    const child = createFakeChildProcess();
    const middleware = createAgentUiExpressMiddleware(
      testBridgeOptions(() => ({ ...child.process, stdout: null })),
    );
    const response = createResponse();

    await middleware({ body: { method: "model/list", params: {} } }, response);

    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({
      error: { message: "Codex app-server stdio streams were not created" },
    });
    expect(child.killed()).toBe(true);
  });

  it("rejects unsupported root process options before spawning", async () => {
    let spawnCount = 0;
    const middleware = createAgentUiExpressMiddleware({
      spawn: () => {
        spawnCount += 1;
        return createFakeChildProcess().process;
      },
    } as unknown as Parameters<typeof createAgentUiExpressMiddleware>[0]);
    const response = createResponse();

    await middleware({ body: { method: "model/list", params: {} } }, response);

    expect(response.statusCode).toBe(500);
    expect(JSON.stringify(response.body)).toContain(
      "Unsupported root App Server bridge option: spawn",
    );
    expect(spawnCount).toBe(0);
  });

  it("rejects host-only methods before spawning the App Server process", async () => {
    let spawnCount = 0;
    const middleware = createAgentUiExpressMiddleware(
      testBridgeOptions(() => {
        spawnCount += 1;
        return createFakeChildProcess().process;
      }),
    );
    const response = createResponse();

    await middleware(
      { body: { method: "fs/readFile", params: { path: "/tmp/secret" } } },
      response,
    );

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: -32601,
        data: { method: "fs/readFile" },
        message: "Codex method is not allowed: fs/readFile",
      },
    });
    expect(spawnCount).toBe(0);
  });

  it("rejects command execution by default", async () => {
    let spawnCount = 0;
    const middleware = createAgentUiExpressMiddleware(
      testBridgeOptions(() => {
        spawnCount += 1;
        return createFakeChildProcess().process;
      }),
    );
    const response = createResponse();

    await middleware(
      { body: { method: "command/exec", params: { command: "pwd" } } },
      response,
    );

    expect(response.statusCode).toBe(403);
    expect(response.body).toMatchObject({
      error: { code: -32601, data: { method: "command/exec" } },
    });
    expect(spawnCount).toBe(0);
  });

  it("rejects mutation and turn-control one-shot methods before spawning by default", async () => {
    for (const method of [
      "initialize",
      "account/logout",
      "thread/start",
      "turn/start",
      "skills/config/write",
      "config/value/write",
    ]) {
      let spawnCount = 0;
      const middleware = createAgentUiExpressMiddleware(
        testBridgeOptions(() => {
          spawnCount += 1;
          return createFakeChildProcess().process;
        }),
      );
      const response = createResponse();

      await middleware({ body: { method, params: {} } }, response);

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        error: { code: -32601, data: { method } },
      });
      expect(spawnCount).toBe(0);
    }
  });

  it("rejects missing or invalid methods before spawning", async () => {
    let spawnCount = 0;
    const middleware = createAgentUiExpressMiddleware(
      testBridgeOptions(() => {
        spawnCount += 1;
        return createFakeChildProcess().process;
      }),
    );
    const response = createResponse();

    await middleware({ body: { params: {} } }, response);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: -32600,
        message: "Missing or invalid method",
      },
    });
    expect(spawnCount).toBe(0);
  });

  it("allows a host-provided method allowlist", async () => {
    const child = createFakeChildProcess();
    const middleware = createAgentUiExpressMiddleware({
      allowedMethods: ["fs/readFile"],
      ...testBridgeOptions(() => child.process),
    });
    const response = createResponse();
    const pending = middleware(
      { body: { method: "fs/readFile", params: { path: "/tmp/data" } } },
      response,
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
    await pending;

    expect(response.body).toEqual({ result: { content: "ok" } });
    expect(child.killed()).toBe(true);
  });
});

function testBridgeOptions(spawn: () => CodexChildProcess) {
  return {
    [agentUiServerInternalBridgeOptions]: { spawn },
  };
}

function createResponse(): MinimalExpressResponse & {
  body: unknown;
  statusCode: number;
} {
  return {
    body: undefined,
    json(value: unknown) {
      this.body = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    statusCode: 200,
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
