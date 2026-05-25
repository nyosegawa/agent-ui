import {
  attachAgentUiWebSocketBridge,
  createAgentUiLocalUploadHandler,
} from "@nyosegawa/agent-ui-server";
import react from "@vitejs/plugin-react";
import { execFile } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createServer as createViteServer } from "vite";
import { isSuppressedCodexDiagnostic } from "./src/diagnostics";
import { isDirectoryPickerCancelError } from "./src/directory-picker";

const host = process.env.AGENT_UI_HOST ?? "127.0.0.1";
const port = Number(process.env.AGENT_UI_PORT ?? 5175);
const cwd = process.env.AGENT_UI_CODEX_CWD ?? process.cwd();
const codexCommand = process.env.AGENT_UI_CODEX_COMMAND;
const codexArgs = process.env.AGENT_UI_CODEX_ARGS
  ? JSON.parse(process.env.AGENT_UI_CODEX_ARGS)
  : undefined;
const root = dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);

// Composer image / file attachments need a real local path because the Codex
// App Server reads `localImage` inputs from disk. The browser only has a
// `File`, so this host endpoint persists the upload next to the App Server's
// machine and returns an absolute path the agent can actually open. This is a
// host responsibility, not something the agent-ui library fakes with blob URLs.
const uploadHandler = createAgentUiLocalUploadHandler();

async function handleUpload(request: IncomingMessage, response: ServerResponse) {
  await uploadHandler.handle(request, response);
}

async function handleSelectDirectory(response: ServerResponse) {
  if (process.platform !== "darwin") {
    response.statusCode = 501;
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: "Directory picker is only implemented on macOS." }));
    return;
  }
  try {
    const { stdout } = await execFileAsync("osascript", [
      "-e",
      'POSIX path of (choose folder with prompt "Choose working directory")',
    ]);
    const path = stdout.trim().replace(/\/+$/, "");
    response.statusCode = 200;
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ path }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isDirectoryPickerCancelError(error)) {
      response.statusCode = 204;
      response.end();
      return;
    }
    response.statusCode = 500;
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: message }));
  }
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
  if (request.method === "POST" && request.url === "/agent-ui/select-directory") {
    handleSelectDirectory(response).catch((error: unknown) => {
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
  console.log(`Attachment upload directory: ${uploadHandler.directory}`);
});
