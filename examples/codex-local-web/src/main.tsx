import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import {
  AgentChat,
  AgentProvider,
  localImageInput,
  textInput,
  type AgentLocalAttachmentKind,
  type CodexUserInput,
} from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";
import { useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";

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

function App() {
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
      <main className="agent-ui-local-app">
        <AgentChat resolveLocalAttachment={resolveLocalAttachment} threadUrlRouting />
      </main>
    </AgentProvider>
  );
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
