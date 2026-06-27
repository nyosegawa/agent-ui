import { localImageInput, textInput } from "@nyosegawa/agent-ui-codex/request-builders";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  AgentChat,
  AgentProvider,
  type AgentChatOverlayControls,
} from "@nyosegawa/agent-ui-react";
import { useAgentChatController } from "@nyosegawa/agent-ui-react/headless";
import type {
  AgentLocalAttachmentKind,
  AgentResolvedLocalAttachment,
  AgentResolvedResource,
} from "@nyosegawa/agent-ui-react/primitives";
import { useCallback, useState } from "react";

const previewUrlsByPath = new Map<string, string>();

async function uploadToHostLocalMedia(
  file: File,
  kind: AgentLocalAttachmentKind,
): Promise<AgentResolvedLocalAttachment | null> {
  const response = await fetch("/agent-ui/local-media", {
    body: await file.arrayBuffer(),
    headers: { "x-agent-ui-filename": encodeURIComponent(file.name || "upload") },
    method: "POST",
  });
  const uploaded = (await response.json()) as Partial<AgentResolvedLocalAttachment>;
  if (!response.ok || !uploaded.path) return null;
  if (uploaded.previewUrl) previewUrlsByPath.set(uploaded.path, uploaded.previewUrl);
  return {
    ...uploaded,
    displayName: uploaded.displayName ?? uploaded.name ?? file.name,
    input:
      kind === "image"
        ? localImageInput(uploaded.path)
        : textInput(`Attached file: ${uploaded.redactedPath ?? uploaded.path}`),
    mimeType: uploaded.mimeType ?? file.type,
    name: uploaded.name ?? file.name,
    path: uploaded.path,
    sizeBytes: uploaded.sizeBytes ?? file.size,
  };
}

function resolveLocalMediaUrl(path: string): AgentResolvedResource | null {
  const previewUrl = previewUrlsByPath.get(path);
  return previewUrl ? { kind: "url", previewUrl } : null;
}

function HostCommandBar() {
  const chat = useAgentChatController();
  const [status, setStatus] = useState("Ready");
  return (
    <section aria-label="Host command bar">
      <button
        onClick={() => {
          setStatus("Sending");
          void chat
            .sendMessage("Summarize the current thread for the host sidebar.", {
              threadOptions: { cwd: "/workspace/fixed-project" },
              turnOptions: { effort: "medium", model: "gpt-5-codex" },
            })
            .then((result) => setStatus(result.type))
            .catch((error: unknown) =>
              setStatus(error instanceof Error ? error.message : "Send failed"),
            );
        }}
        type="button"
      >
        Send from host UI
      </button>
      <span>{status}</span>
    </section>
  );
}

export function AgentChatCompositionExample({
  transport,
}: {
  transport: AgentTransport;
}) {
  const [controls, setControls] = useState<
    Pick<AgentChatOverlayControls, "contextSheetOpen" | "sidebarCollapsed">
  >({
    contextSheetOpen: false,
    sidebarCollapsed: true,
  });
  const setSidebarCollapsed = useCallback(
    (sidebarCollapsed: boolean) =>
      setControls((current) => ({ ...current, sidebarCollapsed })),
    [],
  );
  const setContextSheetOpen = useCallback(
    (contextSheetOpen: boolean) =>
      setControls((current) => ({ ...current, contextSheetOpen })),
    [],
  );

  return (
    <AgentProvider transport={transport}>
      <HostCommandBar />
      <AgentChat
        components={{
          StatusBar: ({ Default, end, ...props }) => (
            <Default
              {...props}
              end={
                <>
                  <span>Host status</span>
                  {end}
                </>
              }
            />
          ),
        }}
        controls={{
          contextSheetOpen: controls.contextSheetOpen,
          onContextSheetOpenChange: setContextSheetOpen,
          onSidebarCollapsedChange: setSidebarCollapsed,
          sidebarCollapsed: controls.sidebarCollapsed,
        }}
        resolveLocalAttachment={uploadToHostLocalMedia}
        resolveLocalMediaUrl={resolveLocalMediaUrl}
        startOptions={{
          threadOptions: {
            cwd: "/workspace/fixed-project",
            sandbox: "workspace-write",
            threadSource: "user",
          },
          turnOptions: {
            effort: "high",
            model: "gpt-5-codex",
          },
        }}
        threadHeaderEnd={({ thread }) => (
          <button type="button">Open host actions for {thread.id}</button>
        )}
        usage
      />
    </AgentProvider>
  );
}
