import { mentionInput, type CodexUserInput } from "../codex-request-params";
import type { QueuedFollowUpAttachment } from "../hooks";

export type ComposerAttachmentKind = "image" | "file" | "app" | "plugin";

export type AgentLocalAttachmentKind = Extract<ComposerAttachmentKind, "image" | "file">;

export type AgentLocalAttachmentResolver = (
  file: File,
  kind: AgentLocalAttachmentKind,
) =>
  | CodexUserInput
  | CodexUserInput[]
  | null
  | undefined
  | Promise<CodexUserInput | CodexUserInput[] | null | undefined>;

export type AgentMentionAttachmentKind = Extract<ComposerAttachmentKind, "app" | "plugin">;

export interface AgentComposerMentionAttachment {
  id?: string;
  input?: CodexUserInput;
  label: string;
  value: string;
}

export type AgentComposerMentionResolver = () =>
  | AgentComposerMentionAttachment
  | null
  | undefined
  | Promise<AgentComposerMentionAttachment | null | undefined>;

export interface ComposerAttachment extends QueuedFollowUpAttachment {
  extension?: string;
  id: string;
  input?: CodexUserInput | CodexUserInput[];
  kind: ComposerAttachmentKind;
  label: string;
  previewUrl?: string;
  sizeLabel?: string;
  value: string;
}

export function composerAttachmentInput(attachment: ComposerAttachment): CodexUserInput[] {
  if (Array.isArray(attachment.input)) return attachment.input;
  if (attachment.input) return [attachment.input];
  return [mentionInput(attachment.label, attachment.value)];
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
