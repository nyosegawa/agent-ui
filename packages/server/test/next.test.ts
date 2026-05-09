import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createAgentUiNextRoute, createAgentUiNextRpcRoute, type CodexChildProcess } from "../src";

describe("createAgentUiNextRpcRoute", () => {
  it("handles one request and closes the App Server process", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const writes: string[] = [];
    let killed = false;
    stdin.on("data", (chunk) => writes.push(String(chunk)));

    const process: CodexChildProcess = {
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

    const route = createAgentUiNextRpcRoute({ spawn: () => process });
    const responsePromise = route(
      new Request("http://localhost/api/agent-ui", {
        body: JSON.stringify({ method: "model/list", params: {} }),
        method: "POST",
      }),
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).method === "model/list"));
    const request = writes.map((line) => JSON.parse(line)).find((line) => line.method === "model/list");
    stdout.write(`${JSON.stringify({ id: request.id, result: { data: [] } })}\n`);

    await expect(responsePromise.then((response) => response.json())).resolves.toEqual({
      result: { data: [] },
    });
    expect(killed).toBe(true);
  });

  it("keeps the deprecated route alias for one-shot RPC compatibility", () => {
    expect(createAgentUiNextRoute).toBe(createAgentUiNextRpcRoute);
  });
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > 1000) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
