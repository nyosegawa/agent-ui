"use client";

import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import {
  AgentChat,
  AgentProvider,
  localImageInput,
  mentionInput,
  type AgentLocalAttachmentKind,
  type CodexUserInput,
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
): Promise<CodexUserInput | null> {
  const response = await fetch("/agent-ui/upload", {
    body: await file.arrayBuffer(),
    headers: { "x-agent-ui-filename": encodeURIComponent(file.name || "upload") },
    method: "POST",
  });
  if (!response.ok) return null;
  const result = (await response.json()) as { path?: unknown };
  if (typeof result.path !== "string") return null;
  return kind === "image"
    ? localImageInput(result.path)
    : mentionInput(file.name || result.path, result.path);
}

export default function Page() {
  const transport = useMemo(
    () =>
      createCodexWebSocketTransport({
        initialize: {
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
