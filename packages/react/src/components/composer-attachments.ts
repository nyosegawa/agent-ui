import type { AgentUserInput } from "../agent-input";
import type { QueuedFollowUpAttachment } from "../hooks";
import type { AgentResolvedResourceBase, AgentResourceKind } from "../resources";

export type ComposerAttachmentKind = Extract<
  AgentResourceKind,
  "image" | "file" | "integration"
>;

export type AgentLocalAttachmentKind = Extract<AgentResourceKind, "image" | "file">;

export interface AgentResolvedLocalAttachment extends AgentResolvedResourceBase {
  input: AgentUserInput | AgentUserInput[];
}

export type AgentLocalAttachmentResolver = (
  file: File,
  kind: AgentLocalAttachmentKind,
) =>
  | AgentResolvedLocalAttachment
  | null
  | undefined
  | Promise<AgentResolvedLocalAttachment | null | undefined>;

export interface AgentComposerIntegrationAttachment {
  id?: string;
  input: AgentUserInput | AgentUserInput[];
  label: string;
  value?: string;
}

export type AgentComposerIntegrationResolver = () =>
  | AgentComposerIntegrationAttachment
  | null
  | undefined
  | Promise<AgentComposerIntegrationAttachment | null | undefined>;

export interface AgentComposerIntegration {
  id: string;
  label: string;
  resolve: AgentComposerIntegrationResolver;
  title?: string;
}

export interface ComposerAttachment extends QueuedFollowUpAttachment {
  displayName?: string;
  extension?: string;
  id: string;
  input: AgentUserInput | AgentUserInput[];
  kind: ComposerAttachmentKind;
  label: string;
  previewFailed?: boolean;
  previewUrl?: string;
  previewUrlRevoke?: boolean;
  redactedPath?: string;
  sizeLabel?: string;
  value?: string;
}

export function composerAttachmentInput(attachment: ComposerAttachment): AgentUserInput[] {
  if (Array.isArray(attachment.input)) return attachment.input;
  return [attachment.input];
}

export function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
  return `${Math.round(size / 1024 / 102.4) / 10} MB`;
}

export function fileExtension(name: string): string | undefined {
  const match = /\.([^.]+)$/.exec(name);
  return match ? `.${match[1]}` : undefined;
}

const IMAGE_ATTACHMENT_EXTENSIONS = new Set([
  ".bmp",
  ".gif",
  ".heic",
  ".heif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type) return false;
  const extension = fileExtension(file.name)?.toLowerCase();
  return extension ? IMAGE_ATTACHMENT_EXTENSIONS.has(extension) : false;
}
