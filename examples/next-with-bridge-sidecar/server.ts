import {
  attachAgentUiWebSocketBridge,
  createAgentUiLocalUploadHandler,
} from "@nyosegawa/agent-ui-server";
import { createServer } from "node:http";
import next from "next";
import { resolveExampleHost } from "../loopback-host";
import { createIdempotentUploadCleanup } from "./upload-cleanup";

const hostResolution = resolveExampleHost(
  process.env.AGENT_UI_HOST ?? "127.0.0.1",
  process.env.AGENT_UI_ALLOW_NON_LOOPBACK === "1",
);
const host = hostResolution.host;
const port = Number(process.env.AGENT_UI_PORT ?? 5174);
const dev = process.env.NODE_ENV !== "production";
const cwd = process.env.AGENT_UI_CODEX_CWD ?? process.cwd();
const codexCommand = process.env.AGENT_UI_CODEX_COMMAND;
const codexArgs = process.env.AGENT_UI_CODEX_ARGS
  ? JSON.parse(process.env.AGENT_UI_CODEX_ARGS)
  : undefined;

const app = next({ dev, hostname: host, port });
const handle = app.getRequestHandler();
const uploadHandler = createAgentUiLocalUploadHandler();
const cleanupUploads = createIdempotentUploadCleanup(() => uploadHandler.cleanup(), {
  onError(error) {
    console.warn(`Failed to clean Agent UI upload directory: ${String(error)}`);
  },
});

await app.prepare();

const server = createServer((request, response) => {
  if (request.method === "POST" && request.url === "/agent-ui/upload") {
    uploadHandler.handle(request, response).catch((error: unknown) => {
      response.statusCode = 500;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: String(error) }));
    });
    return;
  }
  void handle(request, response);
});

attachAgentUiWebSocketBridge({
  ...(codexArgs ? { args: codexArgs } : {}),
  ...(codexCommand ? { command: codexCommand } : {}),
  cwd,
  path: "/agent-ui/ws",
  server,
  stderr(line: string) {
    process.stderr.write(line);
  },
});

server.on("close", () => {
  void cleanupUploads();
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => {
      void cleanupUploads().finally(() => process.exit(0));
    });
  });
}

server.listen(port, host, () => {
  if (hostResolution.warning) console.warn(hostResolution.warning);
  console.log(`Agent UI Next bridge example: http://${host}:${port}`);
  console.log(`Codex working directory: ${cwd}`);
  console.log(`Attachment upload directory: ${uploadHandler.directory}`);
});
