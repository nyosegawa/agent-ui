"use client";

import {
  localImageInput,
  textInput,
} from "@nyosegawa/agent-ui-codex/request-builders";
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import type {
  AgentLocalAttachmentKind,
  AgentResolvedLocalAttachment,
} from "@nyosegawa/agent-ui-react/primitives";
import { useMemo } from "react";

const localMediaUrlsByPath = new Map<string, string>();

function getAgentUiWebSocketUrl(): string {
  if (typeof window === "undefined") return "ws://127.0.0.1/agent-ui/ws";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/agent-ui/ws`;
}

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

function resolveLocalMediaUrl(path: string) {
  const previewUrl = localMediaUrlsByPath.get(path);
  return previewUrl ? { kind: "url" as const, previewUrl } : null;
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
        <AgentChat
          resolveLocalAttachment={resolveLocalAttachment}
          resolveLocalMediaUrl={resolveLocalMediaUrl}
        />
      </main>
    </AgentProvider>
  );
}
