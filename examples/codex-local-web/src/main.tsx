import {
  localImageInput,
  textInput,
} from "@nyosegawa/agent-ui-codex/request-builders";
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import {
  AgentChat,
  AgentLocaleSelect,
  AgentProvider,
  AgentThemeToggle,
  type AgentLocale,
  type AgentTheme,
  type AgentLocalAttachmentKind,
  type AgentResolvedLocalAttachment,
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

const localMediaUrlsByPath = new Map<string, string>();

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
): Promise<AgentResolvedLocalAttachment | null> {
  const response = await fetch("/agent-ui/upload", {
    body: await file.arrayBuffer(),
    headers: { "x-agent-ui-filename": encodeURIComponent(file.name || "upload") },
    method: "POST",
  });
  const result = (await response.json()) as {
    displayName?: unknown;
    error?: unknown;
    id?: unknown;
    mimeType?: unknown;
    name?: unknown;
    path?: unknown;
    previewUrl?: unknown;
    redactedPath?: unknown;
    sizeBytes?: unknown;
    url?: unknown;
  };
  if (!response.ok) {
    throw new Error(typeof result.error === "string" ? result.error : "Upload failed.");
  }
  if (typeof result.path !== "string") return null;
  const browserUrl =
    typeof result.previewUrl === "string"
      ? result.previewUrl
      : typeof result.url === "string"
        ? result.url
        : undefined;
  if (browserUrl) localMediaUrlsByPath.set(result.path, browserUrl);
  return {
    displayName:
      typeof result.displayName === "string"
        ? result.displayName
        : typeof result.name === "string"
          ? result.name
          : file.name,
    id: typeof result.id === "string" ? result.id : undefined,
    input:
      kind === "image"
        ? localImageInput(result.path)
        : textInput(`Attached file: ${result.path}`),
    mimeType: typeof result.mimeType === "string" ? result.mimeType : file.type,
    name: typeof result.name === "string" ? result.name : file.name,
    path: result.path,
    previewUrl: browserUrl,
    redactedPath:
      typeof result.redactedPath === "string" ? result.redactedPath : undefined,
    sizeBytes:
      typeof result.sizeBytes === "number" ? result.sizeBytes : file.size,
    url: typeof result.url === "string" ? result.url : undefined,
  };
}

function resolveLocalMediaUrl(path: string): string | null {
  return localMediaUrlsByPath.get(path) ?? null;
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
  const [locale, setLocale] = useState<AgentLocale>(() => localeFromLocation());
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
          diagnostics
          locale={locale}
          onRequestWorkingDirectory={requestWorkingDirectory}
          resolveLocalAttachment={resolveLocalAttachment}
          resolveLocalMediaUrl={resolveLocalMediaUrl}
          statusBarEnd={
            <>
              <AgentLocaleSelect value={locale} onChange={setLocale} />
              <AgentThemeToggle value={theme} onChange={setTheme} />
            </>
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

function localeFromLocation(): AgentLocale {
  const locale = new URLSearchParams(window.location.search).get("locale");
  return locale === "ja" ||
    locale === "ko" ||
    locale === "zh-CN" ||
    locale === "es" ||
    locale === "fr" ||
    locale === "en"
    ? locale
    : "en";
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
