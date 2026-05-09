import { attachAgentUiWebSocketBridge } from "@nyosegawa/agent-ui-server";
import react from "@vitejs/plugin-react";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const host = process.env.AGENT_UI_HOST ?? "127.0.0.1";
const port = Number(process.env.AGENT_UI_PORT ?? 5174);
const cwd = process.env.AGENT_UI_CODEX_CWD ?? process.cwd();
const codexCommand = process.env.AGENT_UI_CODEX_COMMAND;
const codexArgs = process.env.AGENT_UI_CODEX_ARGS
  ? JSON.parse(process.env.AGENT_UI_CODEX_ARGS)
  : undefined;
const root = dirname(fileURLToPath(import.meta.url));

const vite = await createViteServer({
  appType: "spa",
  plugins: [react()],
  root,
  server: { middlewareMode: true },
});

const server = createServer((request, response) => {
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
    process.stderr.write(line);
  },
});

server.listen(port, host, () => {
  console.log(`Agent UI Codex local web: http://${host}:${port}`);
  console.log(`Codex working directory: ${cwd}`);
});
