import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import {
  AgentChat,
  AgentProvider,
  AgentThemeToggle,
  localImageInput,
  textInput,
  type AgentTheme,
  type AgentLocalAttachmentKind,
  type CodexUserInput,
} from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";
import { useMemo, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import "./styles.css";

declare global {
  interface Window {
    __agentUiCodexLocalWebRoot?: Root;
  }
}

/**
 * Host-supplied attachment resolver. The browser only holds a `File`; the
 * Codex App Server needs a real local path for `localImage` inputs. The file
 * is uploaded to the local host process (see `server.ts`), which returns an
 * absolute path the agent can read. Images become `localImage` inputs; other
 * files become explicit text so the model can see the saved local path.
 */
async function resolveLocalAttachment(
  file: File,
  kind: AgentLocalAttachmentKind,
): Promise<CodexUserInput | null> {
  const response = await fetch("/agent-ui/upload", {
    body: await file.arrayBuffer(),
    headers: { "x-agent-ui-filename": encodeURIComponent(file.name || "upload") },
    method: "POST",
  });
  const result = (await response.json()) as { error?: unknown; path?: unknown };
  if (!response.ok) {
    throw new Error(typeof result.error === "string" ? result.error : "Upload failed.");
  }
  if (typeof result.path !== "string") return null;
  if (kind === "image") return localImageInput(result.path);
  return textInput(`Attached file: ${result.path}`);
}

async function requestWorkingDirectory(): Promise<string | null> {
  const response = await fetch("/agent-ui/select-directory", { method: "POST" });
  if (response.status === 204) return null;
  const result = (await response.json()) as { error?: unknown; path?: unknown };
  if (!response.ok) {
    const fallback = window.prompt(
      typeof result.error === "string" ? result.error : "Working directory",
      "",
    );
    return fallback?.trim() || null;
  }
  return typeof result.path === "string" ? result.path : null;
}

function App() {
  const [theme, setTheme] = useState<AgentTheme>(() => themeFromLocation());
  const transport = useMemo(
    () =>
      createCodexWebSocketTransport({
        initialize: {
          capabilities: {
            experimentalApi: false,
            requestAttestation: false,
          },
          clientInfo: {
            name: "agent_ui_codex_local_web",
            title: "Agent UI Codex Local Web",
            version: "0.0.0",
          },
        },
        reconnect: {
          initialDelayMs: 500,
          maxAttempts: 5,
          maxDelayMs: 5000,
        },
        url: `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/agent-ui/ws`,
      }),
    [],
  );

  return (
    <AgentProvider transport={transport}>
      <main className="agent-ui-local-app" data-aui-theme={theme}>
        <AgentChat
          onRequestWorkingDirectory={requestWorkingDirectory}
          resolveLocalAttachment={resolveLocalAttachment}
          statusBarEnd={
            <AgentThemeToggle
              aria-label="Theme"
              value={theme}
              onChange={setTheme}
            />
          }
          theme={theme}
          threadUrlRouting
        />
      </main>
    </AgentProvider>
  );
}

function themeFromLocation(): AgentTheme {
  const theme = new URLSearchParams(window.location.search).get("theme");
  return theme === "dark" || theme === "system" || theme === "light" ? theme : "light";
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element");

const root = window.__agentUiCodexLocalWebRoot ?? createRoot(rootElement);
window.__agentUiCodexLocalWebRoot = root;
root.render(<App />);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    root.unmount();
    window.__agentUiCodexLocalWebRoot = undefined;
  });
}
