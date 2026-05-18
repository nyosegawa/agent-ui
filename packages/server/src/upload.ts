import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

const DEFAULT_MAX_UPLOAD_BYTES = 16 * 1024 * 1024;
const DEFAULT_UPLOAD_TTL_MS = 60 * 60 * 1000;

export function createAgentUiLocalUploadHandler(
  options: AgentUiUploadHandlerOptions = {},
): AgentUiUploadHandler {
  const now = options.now ?? Date.now;
  const sessionId = sanitizeSegment(options.sessionId ?? `${now()}-${Math.random().toString(36).slice(2, 10)}`);
  const rootDirectory = options.directory ?? join(tmpdir(), "agent-ui-uploads");
  const directory = join(rootDirectory, sessionId);
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;
  const ttlMs = options.ttlMs ?? DEFAULT_UPLOAD_TTL_MS;

  return {
    cleanup: () => rm(directory, { force: true, recursive: true }),
    directory,
    async handle(request, response) {
      await cleanupExpiredUploadSessions(rootDirectory, ttlMs, now());
      if (request.method && request.method !== "POST") {
        request.resume();
        writeJson(response, 405, { error: "Uploads require POST." });
        return;
      }
      const contentType = String(request.headers["content-type"] ?? "");
      if (contentType && !isAllowedContentType(contentType)) {
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
      const safeName = sanitizeFilename(rawName);
      await mkdir(directory, { recursive: true });
      const path = join(
        directory,
        `${now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`,
      );
      await writeFile(path, Buffer.concat(chunks));
      writeJson(response, 200, { path });
    },
  };
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
  return rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload";
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "session";
}

function isAllowedContentType(contentType: string): boolean {
  return /^(application\/octet-stream|image\/[-+.\w]+|text\/plain)(?:\s*;|$)/i.test(
    contentType,
  );
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}
