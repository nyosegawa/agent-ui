import { localImageInput, textInput } from "@nyosegawa/agent-ui-codex/request-builders";
import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  createAgentUiLocalMediaHelper,
  type AgentUiLocalMediaHelper,
} from "@nyosegawa/agent-ui-server";
import {
  AgentChat,
  AgentProvider,
} from "@nyosegawa/agent-ui-react";
import type {
  AgentLocalAttachmentKind,
  AgentResolvedLocalAttachment,
} from "@nyosegawa/agent-ui-react/primitives";
import type { IncomingMessage, ServerResponse } from "node:http";

export const localMediaHelper: AgentUiLocalMediaHelper =
  createAgentUiLocalMediaHelper();

export async function handleLocalMediaUpload(
  request: IncomingMessage,
  response: ServerResponse,
) {
  await localMediaHelper.handleUpload(request, response);
}

export async function handleLocalMediaAsset(
  request: IncomingMessage,
  response: ServerResponse,
) {
  await localMediaHelper.serveAssetHandler(request, response);
}

const previewUrlsByPath = new Map<string, string>();

export async function resolveLocalAttachment(
  file: File,
  kind: AgentLocalAttachmentKind,
): Promise<AgentResolvedLocalAttachment | null> {
  const response = await fetch("/agent-ui/upload", {
    body: await file.arrayBuffer(),
    headers: { "x-agent-ui-filename": encodeURIComponent(file.name || "upload") },
    method: "POST",
  });
  const result = (await response.json()) as Partial<AgentResolvedLocalAttachment> & {
    error?: string;
  };
  if (!response.ok) throw new Error(result.error ?? "Upload failed.");
  if (!result.path) return null;
  if (result.previewUrl) previewUrlsByPath.set(result.path, result.previewUrl);
  return {
    ...result,
    displayName: result.displayName ?? result.name ?? file.name,
    input:
      kind === "image"
        ? localImageInput(result.path)
        : textInput(`Attached file: ${result.path}`),
    mimeType: result.mimeType ?? file.type,
    name: result.name ?? file.name,
    path: result.path,
    sizeBytes: result.sizeBytes ?? file.size,
  };
}

export function resolveLocalMediaUrl(path: string) {
  const previewUrl = previewUrlsByPath.get(path);
  return previewUrl ? { kind: "url" as const, previewUrl } : null;
}

export function LocalMediaHelperExample({ transport }: { transport: AgentTransport }) {
  return (
    <AgentProvider transport={transport}>
      <AgentChat
        resolveLocalAttachment={resolveLocalAttachment}
        resolveLocalMediaUrl={resolveLocalMediaUrl}
      />
    </AgentProvider>
  );
}
