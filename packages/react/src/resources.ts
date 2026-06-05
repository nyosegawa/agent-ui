import type { AgentItemState } from "@nyosegawa/agent-ui-core";
import type { AgentUserInput } from "./agent-input";

export type AgentResourceKind =
  | "image"
  | "file"
  | "app"
  | "plugin"
  | "url"
  | "unavailable";

export interface AgentResolvedResourceBase {
  displayName?: string;
  id?: string;
  input?: AgentUserInput | AgentUserInput[];
  mimeType?: string;
  name?: string;
  path?: string;
  previewUrl?: string;
  redactedPath?: string;
  reason?: string;
  sizeBytes?: number;
  url?: string;
}

export interface AgentResolvedUrlResource extends AgentResolvedResourceBase {
  kind: "url";
}

export interface AgentUnavailableResource extends AgentResolvedResourceBase {
  kind: "unavailable";
}

export type AgentResolvedResource =
  | AgentResolvedUrlResource
  | AgentUnavailableResource;

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
  | null
  | undefined;

export type AgentResourceResolver = (
  request: AgentResourceRequest,
) => AgentResourceResolution | Promise<AgentResourceResolution>;

export function agentResourceUrl(
  resource: AgentResolvedResourceBase | null | undefined,
): string | undefined {
  if (!resource) return undefined;
  return resource.previewUrl ?? resource.url;
}

export function agentResourceDisplayName(
  resource: AgentResolvedResourceBase | null | undefined,
  fallback?: string,
): string | undefined {
  return resource?.displayName ?? resource?.name ?? fallback;
}
