import {
  attachAgentUiWebSocketBridge,
  createAgentUiLocalMediaHelper,
} from "@nyosegawa/agent-ui-server";
import react from "@vitejs/plugin-react";
import { execFile } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createServer as createViteServer } from "vite";
import { resolveExampleHost } from "../loopback-host";
import { isSuppressedCodexDiagnostic } from "./src/diagnostics";
import { isDirectoryPickerCancelError } from "./src/directory-picker";
import { createIdempotentUploadCleanup } from "./src/upload-cleanup";

const hostResolution = resolveExampleHost(
  process.env.AGENT_UI_HOST ?? "127.0.0.1",
  process.env.AGENT_UI_ALLOW_NON_LOOPBACK === "1",
);
const host = hostResolution.host;
const port = Number(process.env.AGENT_UI_PORT ?? 5175);
const cwd = process.env.AGENT_UI_CODEX_CWD ?? process.cwd();
const codexCommand = process.env.AGENT_UI_CODEX_COMMAND;
const codexArgs = process.env.AGENT_UI_CODEX_ARGS
  ? JSON.parse(process.env.AGENT_UI_CODEX_ARGS)
  : undefined;
const root = dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);

// Composer attachments need both an App Server-readable local path and a
// browser-safe preview URL. This helper registers local media by opaque asset
// ID; the host still decides which upload/static routes are wired.
const mediaHelper = createAgentUiLocalMediaHelper();
const cleanupUploads = createIdempotentUploadCleanup(mediaHelper, (error) => {
  console.warn(`Attachment upload cleanup failed: ${String(error)}`);
});

async function handleUpload(request: IncomingMessage, response: ServerResponse) {
  await mediaHelper.handleUpload(request, response);
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

const server = createServer((request, response) => {
  if (request.method === "POST" && request.url === "/agent-ui/upload") {
    handleUpload(request, response).catch((error: unknown) => {
      response.statusCode = 500;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: String(error) }));
    });
    return;
  }
  if (request.url?.startsWith("/agent-ui/assets/")) {
    mediaHelper.serveAssetHandler(request, response).catch((error: unknown) => {
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

const vite = await createViteServer({
  appType: "spa",
  plugins: [react()],
  root,
  server: {
    hmr: { path: "/vite-hmr", server },
    middlewareMode: true,
  },
});
server.on("close", () => {
  void cleanupUploads();
});

attachAgentUiWebSocketBridge({
  ...(codexArgs ? { args: codexArgs } : {}),
  ...(codexCommand ? { command: codexCommand } : {}),
  bridgePolicy: { admission: { mode: "local-loopback" } },
  browserMethodPolicy: "productized",
  cwd,
  resolveBridgeOptions({ request }) {
    const stateNamespace = request
      ? new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`)
          .searchParams.get("agentUiState")
      : null;
    if (!stateNamespace) return {};
    return {
      env: {
        ...process.env,
        AGENT_UI_FAKE_CODEX_STATE_NAMESPACE: stateNamespace,
      },
    };
  },
  hostEvents: {
    onBridgeHealthEvent(event) {
      process.stderr.write(
        `[agent-ui] bridge phase=${event.phase} pending=${event.state.pendingRequestCount}\n`,
      );
    },
  },
  path: "/agent-ui/ws",
  server,
  stderr(line) {
    if (!isSuppressedCodexDiagnostic(line)) process.stderr.write(line);
  },
});

server.listen(port, host, () => {
  if (hostResolution.warning) console.warn(hostResolution.warning);
  console.log(`Agent UI Codex local web: http://${host}:${port}`);
  console.log(`Codex working directory: ${cwd}`);
  console.log(`Attachment upload directory: ${mediaHelper.directory}`);
});

async function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}; closing Agent UI Codex local web server.`);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await vite.close();
  await cleanupUploads();
  process.exit(0);
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
