import { mkdir, readFile, stat, symlink, utimes, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAgentUiLocalMediaHelper, createAgentUiLocalUploadHandler } from "../src";

const servers: Array<{
  close: (callback?: () => void) => void;
  closeAllConnections?: () => void;
}> = [];
const managedUploadSessionMarker = ".agent-ui-upload-session";
const managedUploadSessionMarkerContent = "agent-ui-managed-upload-session\n";

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
    if (!address || typeof address === "string")
      throw new Error("missing server address");

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
    if (!address || typeof address === "string")
      throw new Error("missing server address");

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
    if (!address || typeof address === "string")
      throw new Error("missing server address");

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
    if (!address || typeof address === "string")
      throw new Error("missing server address");

    const methodResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      { method: "GET" },
    );
    expect(methodResponse.status).toBe(405);
    await methodResponse.text();
    const contentTypeResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: "{}",
        headers: { "content-type": "application/json" },
        method: "POST",
      },
    );
    expect(contentTypeResponse.status).toBe(415);
    expect(contentTypeResponse.headers.get("x-content-type-options")).toBe("nosniff");
    await contentTypeResponse.text();
    const svgResponse = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "<svg><script>alert(1)</script></svg>",
      headers: { "content-type": "image/svg+xml; charset=utf-8" },
      method: "POST",
    });
    expect(svgResponse.status).toBe(415);
    expect(svgResponse.headers.get("x-content-type-options")).toBe("nosniff");
    await svgResponse.text();
    const missingTypeSvgResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: "<svg><script>alert(1)</script></svg>",
        method: "POST",
      },
    );
    expect(missingTypeSvgResponse.status).toBe(415);
    expect(missingTypeSvgResponse.headers.get("x-content-type-options")).toBe("nosniff");
    await missingTypeSvgResponse.text();
    const octetSvgResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: '<?xml version="1.0"?><svg></svg>',
        headers: { "content-type": "application/octet-stream" },
        method: "POST",
      },
    );
    expect(octetSvgResponse.status).toBe(415);
    await octetSvgResponse.text();
    const paddedSvgResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: `<!--${"x".repeat(64)}--><svg><script>alert(1)</script></svg>`,
        headers: {
          "content-type": "text/plain",
          "x-agent-ui-filename": encodeURIComponent("payload.txt"),
        },
        method: "POST",
      },
    );
    expect(paddedSvgResponse.status).toBe(415);
    await paddedSvgResponse.text();
    const namespacedSvgResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: '<svg:svg xmlns:svg="http://www.w3.org/2000/svg"></svg:svg>',
        headers: {
          "content-type": "text/plain",
          "x-agent-ui-filename": encodeURIComponent("namespaced.txt"),
        },
        method: "POST",
      },
    );
    expect(namespacedSvgResponse.status).toBe(415);
    await namespacedSvgResponse.text();
    const doctypeSvgResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: '<!DOCTYPE svg [ <!ENTITY x "y"> ]><svg></svg>',
        headers: {
          "content-type": "application/octet-stream",
          "x-agent-ui-filename": encodeURIComponent("doctype.bin"),
        },
        method: "POST",
      },
    );
    expect(doctypeSvgResponse.status).toBe(415);
    await doctypeSvgResponse.text();
    const nonSvgDoctypeResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: '<!DOCTYPE note [ <!ENTITY label "svg icon label"> ]><note/>',
        headers: {
          "content-type": "text/plain",
          "x-agent-ui-filename": encodeURIComponent("note.txt"),
        },
        method: "POST",
      },
    );
    expect(nonSvgDoctypeResponse.status).toBe(200);
    await nonSvgDoctypeResponse.text();
    const svgExtensionResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: "mislabeled",
        headers: {
          "content-type": "text/plain",
          "x-agent-ui-filename": encodeURIComponent("active.svg"),
        },
        method: "POST",
      },
    );
    expect(svgExtensionResponse.status).toBe(415);
    await svgExtensionResponse.text();
    const filenameResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: "x",
        headers: { "content-type": "text/plain", "x-agent-ui-filename": "%E0%A4%A" },
        method: "POST",
      },
    );
    expect(filenameResponse.status).toBe(400);
    await filenameResponse.text();
  });

  it("cleans the per-session directory directly and removes only expired managed upload sessions", async () => {
    let now = 10_000;
    const root = join(tmpdir(), `agent-ui-upload-ttl-${Date.now()}`);
    const staleManaged = join(root, "stale-managed-session");
    const staleUnmanaged = join(root, "host-owned-stale-session");
    const staleMalformedMarker = join(root, "stale-malformed-marker");
    const staleSymlinkMarker = join(root, "stale-symlink-marker");
    const currentManaged = join(root, "current-session");
    await createManagedSession(staleManaged, "old");
    await mkdir(staleUnmanaged, { recursive: true });
    await writeFile(join(staleUnmanaged, "old.txt"), "old");
    await mkdir(staleMalformedMarker, { recursive: true });
    await mkdir(join(staleMalformedMarker, managedUploadSessionMarker), {
      recursive: true,
    });
    await mkdir(staleSymlinkMarker, { recursive: true });
    await writeFile(join(root, "outside-marker"), managedUploadSessionMarkerContent);
    await symlink(
      join(root, "outside-marker"),
      join(staleSymlinkMarker, managedUploadSessionMarker),
    );
    await createManagedSession(currentManaged, "current");
    for (const stalePath of [
      staleManaged,
      staleUnmanaged,
      staleMalformedMarker,
      staleSymlinkMarker,
      currentManaged,
    ]) {
      await utimes(stalePath, new Date(0), new Date(0));
    }

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
    if (!address || typeof address === "string")
      throw new Error("missing server address");
    now += 10_000;

    const response = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "image",
      headers: { "content-type": "image/png", "x-agent-ui-filename": "image.png" },
      method: "POST",
    });
    expect(response.status).toBe(200);
    await expect(stat(staleManaged)).rejects.toThrow();
    await expect(readFile(join(staleUnmanaged, "old.txt"), "utf8")).resolves.toBe("old");
    await expect(stat(staleMalformedMarker)).resolves.toBeDefined();
    await expect(stat(staleSymlinkMarker)).resolves.toBeDefined();
    await expect(readFile(join(currentManaged, "old.txt"), "utf8")).resolves.toBe(
      "current",
    );

    const result = (await response.json()) as { path?: string };
    await expect(readFile(result.path ?? "", "utf8")).resolves.toBe("image");
    await upload.cleanup();
    await expect(stat(upload.directory)).rejects.toThrow();
  });

  it("does not mark or recursively clean up a pre-existing unmanaged session directory", async () => {
    const root = join(tmpdir(), `agent-ui-upload-existing-${Date.now()}`);
    const existingSession = join(root, "host-session");
    await mkdir(existingSession, { recursive: true });
    await writeFile(join(existingSession, "host-owned.txt"), "keep");

    const upload = createAgentUiLocalUploadHandler({
      directory: root,
      maxBytes: 128,
      sessionId: "host-session",
      ttlMs: 1,
    });
    const server = createServer((request, response) => {
      void upload.handle(request, response);
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("missing server address");

    const response = await fetch(`http://127.0.0.1:${address.port}/agent-ui/upload`, {
      body: "temporary",
      headers: { "x-agent-ui-filename": "temporary.txt" },
      method: "POST",
    });

    expect(response.status).toBe(200);
    const result = (await response.json()) as { path?: string };
    await expect(
      stat(join(existingSession, managedUploadSessionMarker)),
    ).rejects.toThrow();
    await expect(readFile(result.path ?? "", "utf8")).resolves.toBe("temporary");

    await upload.cleanup();
    await expect(readFile(join(existingSession, "host-owned.txt"), "utf8")).resolves.toBe(
      "keep",
    );
    await expect(stat(result.path ?? "")).rejects.toThrow();
  });

  it("preserves other active managed sessions during TTL cleanup", async () => {
    let now = 10_000;
    const root = join(tmpdir(), `agent-ui-upload-active-${Date.now()}`);
    const firstUpload = createAgentUiLocalUploadHandler({
      directory: root,
      now: () => now,
      sessionId: "active-a",
      ttlMs: 1,
    });
    const secondUpload = createAgentUiLocalUploadHandler({
      directory: root,
      now: () => now,
      sessionId: "active-b",
      ttlMs: 1,
    });
    const firstServer = createServer((request, response) => {
      void firstUpload.handle(request, response);
    });
    const secondServer = createServer((request, response) => {
      void secondUpload.handle(request, response);
    });
    servers.push(firstServer, secondServer);
    await new Promise<void>((resolve) => firstServer.listen(0, "127.0.0.1", resolve));
    await new Promise<void>((resolve) => secondServer.listen(0, "127.0.0.1", resolve));
    const firstAddress = firstServer.address();
    const secondAddress = secondServer.address();
    if (!firstAddress || typeof firstAddress === "string")
      throw new Error("missing first server address");
    if (!secondAddress || typeof secondAddress === "string")
      throw new Error("missing second server address");

    const firstResponse = await fetch(
      `http://127.0.0.1:${firstAddress.port}/agent-ui/upload`,
      {
        body: "first",
        headers: { "x-agent-ui-filename": "first.txt" },
        method: "POST",
      },
    );
    expect(firstResponse.status).toBe(200);
    const firstResult = (await firstResponse.json()) as { path?: string };
    await utimes(firstUpload.directory, new Date(0), new Date(0));
    now += 10_000;

    const secondResponse = await fetch(
      `http://127.0.0.1:${secondAddress.port}/agent-ui/upload`,
      {
        body: "second",
        headers: { "x-agent-ui-filename": "second.txt" },
        method: "POST",
      },
    );

    expect(secondResponse.status).toBe(200);
    const secondResult = (await secondResponse.json()) as { path?: string };
    await expect(readFile(firstResult.path ?? "", "utf8")).resolves.toBe("first");
    await expect(readFile(secondResult.path ?? "", "utf8")).resolves.toBe("second");

    await firstUpload.cleanup();
    await secondUpload.cleanup();
    await expect(stat(firstUpload.directory)).rejects.toThrow();
    await expect(stat(secondUpload.directory)).rejects.toThrow();
  });
});

async function createManagedSession(directory: string, body: string): Promise<void> {
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, managedUploadSessionMarker),
    managedUploadSessionMarkerContent,
  );
  await writeFile(join(directory, "old.txt"), body);
}

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
    if (!address || typeof address === "string")
      throw new Error("missing server address");

    const uploadResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: "image-bytes",
        headers: {
          "content-type": "image/png",
          "x-agent-ui-filename": encodeURIComponent("../unsafe image.png"),
        },
        method: "POST",
      },
    );

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
    expect(assetResponse.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(assetResponse.text()).resolves.toBe("image-bytes");

    const assetHeadResponse = await fetch(
      `http://127.0.0.1:${address.port}${result.url}`,
      {
        method: "HEAD",
      },
    );
    expect(assetHeadResponse.status).toBe(200);
    expect(assetHeadResponse.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("serves only registered asset IDs and supports host admission checks", async () => {
    const helper = createAgentUiLocalMediaHelper({
      createAssetId: () => "asset-denied",
      directory: join(tmpdir(), `agent-ui-media-deny-${Date.now()}`),
      serveAsset: {
        admitRequest: ({ request }) =>
          request.headers["x-agent-ui-session"] === "allowed",
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
    if (!address || typeof address === "string")
      throw new Error("missing server address");

    const uploadResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: "secret",
        method: "POST",
      },
    );
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
    if (!address || typeof address === "string")
      throw new Error("missing server address");

    const uploadResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: "preview",
        method: "POST",
      },
    );
    const asset = (await uploadResponse.json()) as {
      id: string;
      path: string;
      url: string;
    };
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
    if (!address || typeof address === "string")
      throw new Error("missing server address");

    const uploadResponse = await fetch(
      `http://127.0.0.1:${address.port}/agent-ui/upload`,
      {
        body: "registered",
        method: "POST",
      },
    );
    const asset = (await uploadResponse.json()) as {
      id: string;
      path: string;
      url: string;
    };
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
