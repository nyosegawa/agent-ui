import type { AgentItemState } from "@nyosegawa/agent-ui-core";
import type { AgentUserInput } from "./agent-input";

export type AgentResourceKind =
  | "image"
  | "video"
  | "file"
  | "app"
  | "plugin"
  | "local-media";

export interface AgentResolvedResource {
  displayName?: string;
  id?: string;
  input?: AgentUserInput | AgentUserInput[];
  kind?: AgentResourceKind;
  mimeType?: string;
  name?: string;
  path?: string;
  previewUrl?: string;
  redactedPath?: string;
  sizeBytes?: number;
  url?: string;
}

export interface AgentFileResourceRequest {
  file: File;
  kind: Extract<AgentResourceKind, "image" | "file">;
  source: "file";
}

export interface AgentLocalMediaResourceRequest {
  item?: AgentItemState;
  path: string;
  source: "local-media";
}

export type AgentResourceRequest =
  | AgentFileResourceRequest
  | AgentLocalMediaResourceRequest;

export type AgentResourceResolution =
  | AgentResolvedResource
  | string
  | null
  | undefined;

export type AgentResourceResolver = (
  request: AgentResourceRequest,
) => AgentResourceResolution | Promise<AgentResourceResolution>;

export function agentResourceUrl(
  resource: AgentResourceResolution,
): string | undefined {
  if (!resource) return undefined;
  if (typeof resource === "string") return resource;
  return resource.previewUrl ?? resource.url;
}

export function agentResourceDisplayName(
  resource: AgentResolvedResource | null | undefined,
  fallback?: string,
): string | undefined {
  return resource?.displayName ?? resource?.name ?? fallback;
}
