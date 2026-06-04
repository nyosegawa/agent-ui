import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";

export interface AgentUiUploadHandlerOptions {
  directory?: string;
  maxBytes?: number;
  now?: () => number;
  sessionId?: string;
  ttlMs?: number;
}

export interface AgentUiUploadHandler {
  directory: string;
  cleanup(): Promise<void>;
  handle(request: IncomingMessage, response: ServerResponse): Promise<void>;
}

export interface AgentUiLocalMediaHelperOptions extends AgentUiUploadHandlerOptions {
  assetUrlPath?: string;
  createAssetId?: () => string;
  redactPath?: (path: string, name: string) => string;
  serveAsset?: {
    admitRequest?: (context: AgentUiLocalMediaServeContext) => boolean | Promise<boolean>;
  };
}

export interface AgentUiLocalMediaServeContext {
  asset: AgentResolvedAttachment;
  request: IncomingMessage;
}

export interface AgentResolvedAttachment {
  displayName: string;
  id: string;
  name: string;
  path: string;
  url: string;
  redactedPath: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
}

export interface AgentUiLocalMediaHelper {
  directory: string;
  assetUrl(id: string): string;
  cleanup(): Promise<void>;
  getAsset(id: string): AgentResolvedAttachment | undefined;
  handleUpload(request: IncomingMessage, response: ServerResponse): Promise<void>;
  releaseAsset(id: string): Promise<boolean>;
  resolveAssetPath(id: string): string | undefined;
  serveAssetHandler(request: IncomingMessage, response: ServerResponse): Promise<void>;
  uploadHandler: AgentUiUploadHandler;
}

interface RegisteredLocalMediaAsset {
  attachment: Readonly<AgentResolvedAttachment>;
  path: string;
}

const DEFAULT_MAX_UPLOAD_BYTES = 16 * 1024 * 1024;
const DEFAULT_UPLOAD_TTL_MS = 60 * 60 * 1000;
const DEFAULT_ASSET_URL_PATH = "/agent-ui/assets";

export function createAgentUiLocalUploadHandler(
  options: AgentUiUploadHandlerOptions = {},
): AgentUiUploadHandler {
  return createAgentUiLocalMediaHelper(options).uploadHandler;
}

export function createAgentUiLocalMediaHelper(
  options: AgentUiLocalMediaHelperOptions = {},
): AgentUiLocalMediaHelper {
  const now = options.now ?? Date.now;
  const sessionId = sanitizeSegment(options.sessionId ?? `${now()}-${Math.random().toString(36).slice(2, 10)}`);
  const rootDirectory = options.directory ?? join(tmpdir(), "agent-ui-uploads");
  const directory = join(rootDirectory, sessionId);
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;
  const ttlMs = options.ttlMs ?? DEFAULT_UPLOAD_TTL_MS;
  const assetUrlPath = normalizeAssetUrlPath(options.assetUrlPath);
  const createAssetId = options.createAssetId ?? defaultAssetId;
  const redactPath = options.redactPath ?? defaultRedactedPath;
  const assets = new Map<string, RegisteredLocalMediaAsset>();

  const helper: AgentUiLocalMediaHelper = {
    assetUrl(id) {
      return `${assetUrlPath}/${encodeURIComponent(id)}`;
    },
    cleanup: async () => {
      assets.clear();
      await rm(directory, { force: true, recursive: true });
    },
    directory,
    getAsset(id) {
      return copyAsset(assets.get(id)?.attachment);
    },
    handleUpload: async (request, response) => {
      await cleanupExpiredUploadSessions(rootDirectory, ttlMs, now());
      if (request.method && request.method !== "POST") {
        request.resume();
        writeJson(response, 405, { error: "Uploads require POST." });
        return;
      }
      const mimeType = String(request.headers["content-type"] ?? "");
      if (mimeType && !isAllowedContentType(mimeType)) {
        request.resume();
        writeJson(response, 415, { error: "Unsupported upload content type." });
        return;
      }
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of request) {
        total += chunk.length;
        if (total > maxBytes) {
          writeJson(response, 413, {
            error: `Attachment exceeds ${maxBytes} byte upload limit.`,
          });
          request.destroy();
          return;
        }
        chunks.push(Buffer.from(chunk));
      }

      const rawName = decodeFilenameHeader(request.headers["x-agent-ui-filename"]);
      if (rawName == null) {
        writeJson(response, 400, { error: "Malformed x-agent-ui-filename header." });
        return;
      }
      const name = sanitizeFilename(rawName);
      const body = Buffer.concat(chunks);
      if (isSvgUpload(name, mimeType, body)) {
        writeJson(response, 415, { error: "Unsupported upload content type." });
        return;
      }
      await mkdir(directory, { recursive: true });
      const path = join(directory, `${now()}-${Math.random().toString(36).slice(2, 8)}-${name}`);
      await writeFile(path, body);
      const id = createUniqueAssetId(assets, createAssetId);
      const asset = Object.freeze({
        displayName: name,
        id,
        mimeType: mimeType || "application/octet-stream",
        name,
        path,
        previewUrl: helper.assetUrl(id),
        redactedPath: redactPath(path, name),
        sizeBytes: body.byteLength,
        url: helper.assetUrl(id),
      } satisfies AgentResolvedAttachment);
      assets.set(id, { attachment: asset, path });
      writeJson(response, 200, asset);
    },
    releaseAsset: async (id) => {
      const record = assets.get(id);
      if (!record) return false;
      assets.delete(id);
      const safePath = safeRegisteredPath(directory, record.path);
      if (safePath) await rm(safePath, { force: true });
      return true;
    },
    resolveAssetPath(id) {
      return assets.get(id)?.path;
    },
    serveAssetHandler: async (request, response) => {
      if (request.method && request.method !== "GET" && request.method !== "HEAD") {
        request.resume();
        writeJson(response, 405, { error: "Local media assets require GET." });
        return;
      }
      const id = assetIdFromRequest(request, assetUrlPath);
      if (id == null) {
        writeJson(response, 404, { error: "Unknown local media asset." });
        return;
      }
      const record = assets.get(id);
      if (!record) {
        writeJson(response, 404, { error: "Unknown local media asset." });
        return;
      }
      const asset = record.attachment;
      const admitted = await (options.serveAsset?.admitRequest?.({
        asset: { ...asset },
        request,
      }) ?? true);
      if (!admitted) {
        writeJson(response, 403, { error: "Local media asset request was not admitted." });
        return;
      }
      const safePath = safeRegisteredPath(directory, record.path);
      if (safePath == null) {
        writeJson(response, 404, { error: "Unknown local media asset." });
        return;
      }
      let body: Buffer;
      try {
        body = await readFile(safePath);
      } catch {
        writeJson(response, 404, { error: "Local media asset is unavailable." });
        return;
      }
      response.statusCode = 200;
      response.setHeader("content-type", asset.mimeType);
      response.setHeader("content-length", String(body.byteLength));
      response.setHeader("cache-control", "no-store");
      response.setHeader("x-content-type-options", "nosniff");
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      response.end(body);
    },
    uploadHandler: undefined as unknown as AgentUiUploadHandler,
  };

  helper.uploadHandler = {
    cleanup: helper.cleanup,
    directory,
    handle: helper.handleUpload,
  };

  return helper;
}

async function cleanupExpiredUploadSessions(
  rootDirectory: string,
  ttlMs: number,
  now: number,
): Promise<void> {
  if (ttlMs <= 0) return;
  let entries: Array<{ isDirectory(): boolean; name: string }>;
  try {
    entries = (await readdir(rootDirectory, { withFileTypes: true })) as unknown as Array<{
      isDirectory(): boolean;
      name: string;
    }>;
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const path = join(rootDirectory, entry.name);
        try {
          const info = await stat(path);
          if (now - info.mtimeMs > ttlMs) await rm(path, { force: true, recursive: true });
        } catch {
          // Best-effort cleanup for local temporary files.
        }
      }),
  );
}

function decodeFilenameHeader(value: IncomingMessage["headers"][string]): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  if (first == null || first === "") return "upload";
  try {
    const decoded = decodeURIComponent(String(first));
    return /[\0\r\n]/.test(decoded) ? null : decoded;
  } catch {
    return null;
  }
}

function sanitizeFilename(rawName: string): string {
  return rawName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^[._-]+/, "").slice(-80) || "upload";
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "session";
}

function normalizeAssetUrlPath(path: string | undefined): string {
  const value = path ?? DEFAULT_ASSET_URL_PATH;
  return `/${value.split("/").filter(Boolean).join("/")}`;
}

function defaultAssetId(): string {
  return randomBytes(16).toString("base64url");
}

function createUniqueAssetId(
  assets: Map<string, RegisteredLocalMediaAsset>,
  createAssetId: () => string,
): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const id = sanitizeAssetId(createAssetId());
    if (!assets.has(id)) return id;
  }
  throw new Error("Unable to allocate a unique Agent UI local media asset id.");
}

function copyAsset(
  asset: Readonly<AgentResolvedAttachment> | undefined,
): AgentResolvedAttachment | undefined {
  return asset ? { ...asset } : undefined;
}

function sanitizeAssetId(id: string): string {
  const normalized = id.replace(/[^a-zA-Z0-9._~-]/g, "");
  if (!normalized || normalized !== id || normalized.includes("..")) {
    throw new Error("Agent UI local media asset ids must be URL-safe tokens.");
  }
  return normalized;
}

function assetIdFromRequest(
  request: IncomingMessage,
  assetUrlPath: string,
): string | null {
  const url = new URL(request.url ?? "/", "http://agent-ui.local");
  const prefix = `${assetUrlPath}/`;
  if (!url.pathname.startsWith(prefix)) return null;
  const encoded = url.pathname.slice(prefix.length);
  if (!encoded || encoded.includes("/")) return null;
  try {
    return sanitizeAssetId(decodeURIComponent(encoded));
  } catch {
    return null;
  }
}

function safeRegisteredPath(rootDirectory: string, path: string): string | null {
  const root = resolve(rootDirectory);
  const resolved = resolve(path);
  const relation = relative(root, resolved);
  if (relation === "" || (!relation.startsWith("..") && !relation.includes(`..${sep}`))) {
    return resolved;
  }
  return null;
}

function defaultRedactedPath(path: string, name: string): string {
  return `[agent-ui-local-media]/${basename(name || path)}`;
}

function isAllowedContentType(contentType: string): boolean {
  const mimeType = contentType.split(";")[0]?.trim().toLowerCase();
  if (mimeType === "image/svg+xml") return false;
  return (
    mimeType === "application/octet-stream" ||
    mimeType === "text/plain" ||
    Boolean(mimeType?.startsWith("image/"))
  );
}

function isSvgUpload(name: string, contentType: string, body: Buffer): boolean {
  const mimeType = contentType.split(";")[0]?.trim().toLowerCase();
  if (mimeType === "image/svg+xml") return true;
  if (name.toLowerCase().endsWith(".svg")) return true;
  const elementName = firstMarkupElementName(body);
  return elementName?.split(":").pop() === "svg";
}

function firstMarkupElementName(body: Buffer): string | undefined {
  const text = body.toString("utf8").replace(/^\uFEFF/, "");
  let index = 0;
  while (index < text.length) {
    while (/\s/.test(text[index] ?? "")) index += 1;
    if (text[index] !== "<") return undefined;
    const rest = text.slice(index);
    if (rest.startsWith("<!--")) {
      const end = text.indexOf("-->", index + 4);
      if (end === -1) return undefined;
      index = end + 3;
      continue;
    }
    if (rest.startsWith("<?")) {
      const end = text.indexOf("?>", index + 2);
      if (end === -1) return undefined;
      index = end + 2;
      continue;
    }
    if (/^<!doctype\b/i.test(rest)) {
      const end = findDoctypeEnd(text, index + 2);
      if (end === -1) return undefined;
      if (text.slice(index, end + 1).toLowerCase().includes("svg")) return "svg";
      index = end + 1;
      continue;
    }
    const match = /^<([a-zA-Z][\w:.-]*)\b/.exec(rest);
    return match?.[1]?.toLowerCase();
  }
  return undefined;
}

function findDoctypeEnd(text: string, start: number): number {
  let bracketDepth = 0;
  let quote: "\"" | "'" | undefined;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === quote) quote = undefined;
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (char === "[") {
      bracketDepth += 1;
      continue;
    }
    if (char === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
      continue;
    }
    if (char === ">" && bracketDepth === 0) return index;
  }
  return -1;
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.setHeader("x-content-type-options", "nosniff");
  response.end(JSON.stringify(body));
}
