import { mkdir, readFile, stat, utimes, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAgentUiLocalUploadHandler } from "../src";

const servers: Array<{
  close: (callback?: () => void) => void;
  closeAllConnections?: () => void;
}> = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections?.();
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
    expect(result.path).toContain(upload.directory);
    expect(result.path).toMatch(/unsafe_image\.png$/);
    await expect(readFile(result.path ?? "", "utf8")).resolves.toBe("hello");
  });

  it("accepts unknown file extensions and keeps the sanitized extension", async () => {
    const directory = join(tmpdir(), `agent-ui-upload-unknown-${Date.now()}`);
    const upload = createAgentUiLocalUploadHandler({ directory, maxBytes: 128 });
    const server = createServer((request, response) => {
      void upload.handle(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const response = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "mesh",
      headers: { "x-agent-ui-filename": encodeURIComponent("../../part sample.3mf") },
      method: "POST",
    });

    expect(response.status).toBe(200);
    const result = (await response.json()) as { path?: string };
    expect(result.path).toContain(directory);
    expect(result.path).toMatch(/part_sample\.3mf$/);
    await expect(readFile(result.path ?? "", "utf8")).resolves.toBe("mesh");
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

  it("validates method, content type, and malformed filenames", async () => {
    const upload = createAgentUiLocalUploadHandler({ maxBytes: 128 });
    const server = createServer((request, response) => {
      void upload.handle(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const methodResponse = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, { method: "GET" });
    expect(methodResponse.status).toBe(405);
    await methodResponse.text();
    const contentTypeResponse = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "{}",
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    expect(contentTypeResponse.status).toBe(415);
    await contentTypeResponse.text();
    const filenameResponse = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "x",
      headers: { "content-type": "text/plain", "x-agent-ui-filename": "%E0%A4%A" },
      method: "POST",
    });
    expect(filenameResponse.status).toBe(400);
    await filenameResponse.text();
  });

  it("cleans the per-session directory directly and removes expired upload sessions", async () => {
    let now = 10_000;
    const root = join(tmpdir(), `agent-ui-upload-ttl-${Date.now()}`);
    const stale = join(root, "stale-session");
    await mkdir(stale, { recursive: true });
    await writeFile(join(stale, "old.txt"), "old");
    await utimes(stale, new Date(0), new Date(0));

    const upload = createAgentUiLocalUploadHandler({
      directory: root,
      now: () => now,
      sessionId: "current-session",
      ttlMs: 1,
    });
    const server = createServer((request, response) => {
      void upload.handle(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    now += 10_000;

    const response = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "image",
      headers: { "content-type": "image/png", "x-agent-ui-filename": "image.png" },
      method: "POST",
    });
    expect(response.status).toBe(200);
    await expect(stat(stale)).rejects.toThrow();

    const result = (await response.json()) as { path?: string };
    await expect(readFile(result.path ?? "", "utf8")).resolves.toBe("image");
    await upload.cleanup();
    await expect(stat(upload.directory)).rejects.toThrow();
  });
});
