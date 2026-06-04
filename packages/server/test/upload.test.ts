import { mkdir, readFile, stat, utimes, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createAgentUiLocalMediaHelper,
  createAgentUiLocalUploadHandler,
} from "../src";

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

describe("createAgentUiLocalMediaHelper", () => {
  it("returns structured local media metadata and serves registered asset IDs", async () => {
    const directory = join(tmpdir(), `agent-ui-media-test-${Date.now()}`);
    const helper = createAgentUiLocalMediaHelper({
      createAssetId: () => "asset-1",
      directory,
      maxBytes: 128,
      sessionId: "session-a",
    });
    const server = createServer((request, response) => {
      if (request.url?.startsWith("/agent-ui/assets/")) {
        void helper.serveAssetHandler(request, response);
        return;
      }
      void helper.handleUpload(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const uploadResponse = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "image-bytes",
      headers: {
        "content-type": "image/png",
        "x-agent-ui-filename": encodeURIComponent("../unsafe image.png"),
      },
      method: "POST",
    });

    expect(uploadResponse.status).toBe(200);
    const result = (await uploadResponse.json()) as {
      id?: string;
      mimeType?: string;
      name?: string;
      path?: string;
      previewUrl?: string;
      redactedPath?: string;
      sizeBytes?: number;
      url?: string;
    };
    expect(result).toMatchObject({
      displayName: "unsafe_image.png",
      id: "asset-1",
      mimeType: "image/png",
      name: "unsafe_image.png",
      previewUrl: "/agent-ui/assets/asset-1",
      redactedPath: "[agent-ui-local-media]/unsafe_image.png",
      sizeBytes: 11,
      url: "/agent-ui/assets/asset-1",
    });
    expect(result.path).toContain(helper.directory);
    expect(result.url).not.toContain(result.path ?? "");
    expect(helper.resolveAssetPath("asset-1")).toBe(result.path);

    const assetResponse = await fetch(`http://127.0.0.1:${address.port}${result.url}`);
    expect(assetResponse.status).toBe(200);
    expect(assetResponse.headers.get("content-type")).toBe("image/png");
    await expect(assetResponse.text()).resolves.toBe("image-bytes");
  });

  it("serves only registered asset IDs and supports host admission checks", async () => {
    const helper = createAgentUiLocalMediaHelper({
      createAssetId: () => "asset-denied",
      directory: join(tmpdir(), `agent-ui-media-deny-${Date.now()}`),
      serveAsset: {
        admitRequest: ({ request }) => request.headers["x-agent-ui-session"] === "allowed",
      },
    });
    const server = createServer((request, response) => {
      if (request.url?.startsWith("/agent-ui/assets/")) {
        void helper.serveAssetHandler(request, response);
        return;
      }
      void helper.handleUpload(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const uploadResponse = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "secret",
      method: "POST",
    });
    const asset = (await uploadResponse.json()) as { url: string };

    const denied = await fetch(`http://127.0.0.1:${address.port}${asset.url}`);
    expect(denied.status).toBe(403);
    await denied.text();

    const traversal = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/assets/${encodeURIComponent("../secret")}`,
    );
    expect(traversal.status).toBe(404);
    await traversal.text();

    const admitted = await fetch(`http://127.0.0.1:${address.port}${asset.url}`, {
      headers: { "x-agent-ui-session": "allowed" },
    });
    expect(admitted.status).toBe(200);
    await expect(admitted.text()).resolves.toBe("secret");
  });

  it("releases a preview asset by ID and removes the temporary file", async () => {
    const helper = createAgentUiLocalMediaHelper({
      createAssetId: () => "asset-release",
      directory: join(tmpdir(), `agent-ui-media-release-${Date.now()}`),
    });
    const server = createServer((request, response) => {
      if (request.url?.startsWith("/agent-ui/assets/")) {
        void helper.serveAssetHandler(request, response);
        return;
      }
      void helper.handleUpload(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const uploadResponse = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "preview",
      method: "POST",
    });
    const asset = (await uploadResponse.json()) as { id: string; path: string; url: string };
    await expect(readFile(asset.path, "utf8")).resolves.toBe("preview");

    await expect(helper.releaseAsset(asset.id)).resolves.toBe(true);
    expect(helper.getAsset(asset.id)).toBeUndefined();
    expect(helper.resolveAssetPath(asset.id)).toBeUndefined();
    await expect(stat(asset.path)).rejects.toThrow();

    const released = await fetch(`http://127.0.0.1:${address.port}${asset.url}`);
    expect(released.status).toBe(404);
    await released.text();
    await expect(helper.releaseAsset(asset.id)).resolves.toBe(false);
  });

  it("does not let public asset metadata mutation redirect release deletion", async () => {
    let admissionAsset: { path: string } | undefined;
    const helper = createAgentUiLocalMediaHelper({
      createAssetId: () => "asset-mutation",
      directory: join(tmpdir(), `agent-ui-media-mutation-${Date.now()}`),
      serveAsset: {
        admitRequest: ({ asset }) => {
          admissionAsset = asset;
          return true;
        },
      },
    });
    const server = createServer((request, response) => {
      if (request.url?.startsWith("/agent-ui/assets/")) {
        void helper.serveAssetHandler(request, response);
        return;
      }
      void helper.handleUpload(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const uploadResponse = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "registered",
      method: "POST",
    });
    const asset = (await uploadResponse.json()) as { id: string; path: string; url: string };
    const substitutePath = join(helper.directory, "substitute.txt");
    await writeFile(substitutePath, "substitute");

    const publicAsset = helper.getAsset(asset.id);
    if (!publicAsset) throw new Error("missing public asset");
    publicAsset.path = substitutePath;
    expect(helper.resolveAssetPath(asset.id)).toBe(asset.path);

    const served = await fetch(`http://127.0.0.1:${address.port}${asset.url}`);
    expect(served.status).toBe(200);
    await served.text();
    if (!admissionAsset) throw new Error("missing admission asset");
    admissionAsset.path = substitutePath;

    await expect(helper.releaseAsset(asset.id)).resolves.toBe(true);
    await expect(stat(asset.path)).rejects.toThrow();
    await expect(readFile(substitutePath, "utf8")).resolves.toBe("substitute");
  });
});
