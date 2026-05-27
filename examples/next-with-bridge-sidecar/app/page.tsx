"use client";

import {
  localImageInput,
  textInput,
} from "@nyosegawa/agent-ui-codex/request-builders";
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import {
  AgentChat,
  AgentProvider,
  type AgentLocalAttachmentKind,
  type AgentUserInput,
} from "@nyosegawa/agent-ui-react";
import { useMemo } from "react";

function getAgentUiWebSocketUrl(): string {
  if (typeof window === "undefined") return "ws://127.0.0.1/agent-ui/ws";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/agent-ui/ws`;
}

async function resolveLocalAttachment(
  file: File,
  kind: AgentLocalAttachmentKind,
): Promise<AgentUserInput | null> {
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
  return kind === "image"
    ? localImageInput(result.path)
    : textInput(`Attached file: ${result.path}`);
}

export default function Page() {
  const transport = useMemo(
    () =>
      createCodexWebSocketTransport({
        initialize: {
          capabilities: {
            experimentalApi: false,
            requestAttestation: false,
          },
          clientInfo: {
            name: "agent_ui_next_bridge_example",
            title: "Agent UI Next Bridge Example",
            version: "0.0.0",
          },
        },
        reconnect: {
          initialDelayMs: 500,
          maxAttempts: 5,
          maxDelayMs: 5000,
        },
        url: getAgentUiWebSocketUrl(),
      }),
    [],
  );

  return (
    <AgentProvider transport={transport}>
      <main className="agent-ui-local-app">
        <AgentChat resolveLocalAttachment={resolveLocalAttachment} />
      </main>
    </AgentProvider>
  );
}
