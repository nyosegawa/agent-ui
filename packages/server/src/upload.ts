import { mkdir, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface AgentUiUploadHandlerOptions {
  directory?: string;
  maxBytes?: number;
}

export interface AgentUiUploadHandler {
  directory: string;
  handle(request: IncomingMessage, response: ServerResponse): Promise<void>;
}

const DEFAULT_MAX_UPLOAD_BYTES = 16 * 1024 * 1024;

export function createAgentUiLocalUploadHandler(
  options: AgentUiUploadHandlerOptions = {},
): AgentUiUploadHandler {
  const directory = options.directory ?? join(tmpdir(), "agent-ui-uploads");
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;

  return {
    directory,
    async handle(request, response) {
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of request) {
        total += chunk.length;
        if (total > maxBytes) {
          response.statusCode = 413;
          response.setHeader("content-type", "application/json");
          response.end(
            JSON.stringify({
              error: `Attachment exceeds ${maxBytes} byte upload limit.`,
            }),
          );
          request.destroy();
          return;
        }
        chunks.push(Buffer.from(chunk));
      }

      const rawName = decodeURIComponent(
        String(request.headers["x-agent-ui-filename"] ?? "upload"),
      );
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload";
      await mkdir(directory, { recursive: true });
      const path = join(
        directory,
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`,
      );
      await writeFile(path, Buffer.concat(chunks));
      response.statusCode = 200;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ path }));
    },
  };
}
