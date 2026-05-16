import { attachAgentUiWebSocketBridge } from "@nyosegawa/agent-ui-server";
import react from "@vitejs/plugin-react";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { isSuppressedCodexDiagnostic } from "./src/diagnostics";

const host = process.env.AGENT_UI_HOST ?? "127.0.0.1";
const port = Number(process.env.AGENT_UI_PORT ?? 5174);
const cwd = process.env.AGENT_UI_CODEX_CWD ?? process.cwd();
const codexCommand = process.env.AGENT_UI_CODEX_COMMAND;
const codexArgs = process.env.AGENT_UI_CODEX_ARGS
  ? JSON.parse(process.env.AGENT_UI_CODEX_ARGS)
  : undefined;
const root = dirname(fileURLToPath(import.meta.url));

// Composer image / file attachments need a real local path because the Codex
// App Server reads `localImage` inputs from disk. The browser only has a
// `File`, so this host endpoint persists the upload next to the App Server's
// machine and returns an absolute path the agent can actually open. This is a
// host responsibility, not something the agent-ui library fakes with blob URLs.
const uploadDir = join(tmpdir(), "agent-ui-uploads");
const MAX_UPLOAD_BYTES = 16 * 1024 * 1024;

async function handleUpload(request: IncomingMessage, response: ServerResponse) {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_UPLOAD_BYTES) {
      response.statusCode = 413;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: "Attachment exceeds 16 MB upload limit." }));
      request.destroy();
      return;
    }
    chunks.push(Buffer.from(chunk));
  }
  const rawName = decodeURIComponent(
    String(request.headers["x-agent-ui-filename"] ?? "upload"),
  );
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload";
  await mkdir(uploadDir, { recursive: true });
  const path = join(
    uploadDir,
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`,
  );
  await writeFile(path, Buffer.concat(chunks));
  response.statusCode = 200;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ path }));
}

const vite = await createViteServer({
  appType: "spa",
  plugins: [react()],
  root,
  server: { hmr: false, middlewareMode: true },
});

const server = createServer((request, response) => {
  if (request.method === "POST" && request.url === "/agent-ui/upload") {
    handleUpload(request, response).catch((error: unknown) => {
      response.statusCode = 500;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: String(error) }));
    });
    return;
  }
  vite.middlewares(request, response, () => {
    response.statusCode = 404;
    response.end("Not found");
  });
});

attachAgentUiWebSocketBridge({
  ...(codexArgs ? { args: codexArgs } : {}),
  ...(codexCommand ? { command: codexCommand } : {}),
  cwd,
  path: "/agent-ui/ws",
  server,
  stderr(line) {
    if (!isSuppressedCodexDiagnostic(line)) process.stderr.write(line);
  },
});

server.listen(port, host, () => {
  console.log(`Agent UI Codex local web: http://${host}:${port}`);
  console.log(`Codex working directory: ${cwd}`);
  console.log(`Attachment upload directory: ${uploadDir}`);
});
