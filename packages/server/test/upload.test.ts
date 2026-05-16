import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAgentUiLocalUploadHandler } from "../src";

const servers: Array<{ close: (callback?: () => void) => void }> = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
});

describe("createAgentUiLocalUploadHandler", () => {
  it("persists a browser File payload and returns an App Server-readable path", async () => {
    const directory = join(tmpdir(), `agent-ui-upload-test-${Date.now()}`);
    const upload = createAgentUiLocalUploadHandler({ directory, maxBytes: 128 });
    const server = createServer((request, response) => {
      void upload.handle(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const response = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "hello",
      headers: { "x-agent-ui-filename": encodeURIComponent("../unsafe image.png") },
      method: "POST",
    });

    expect(response.status).toBe(200);
    const result = (await response.json()) as { path?: string };
    expect(result.path).toContain(directory);
    expect(result.path).toMatch(/unsafe_image\.png$/);
    await expect(readFile(result.path ?? "", "utf8")).resolves.toBe("hello");
  });

  it("rejects payloads over the configured limit", async () => {
    const upload = createAgentUiLocalUploadHandler({ maxBytes: 2 });
    const server = createServer((request, response) => {
      void upload.handle(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const response = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "too large",
      method: "POST",
    });

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("upload limit"),
    });
  });
});
