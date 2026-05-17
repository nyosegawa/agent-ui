import type React from "react";
import type { ThreadState } from "@nyosegawa/agent-ui-core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAgentComposer } from "../hooks";
import { mentionInput, type CodexUserInput } from "../codex-request-params";
import {
  IconAlert,
  IconApp,
  IconClose,
  IconImage,
  IconPaperclip,
  IconPlugin,
  IconSend,
  IconShield,
  buttonClass,
} from "../components-internal";
import { ComposerRunSettings } from "./run-settings";
import { deferAction } from "./shared";

export function AgentComposer({
  disabled = false,
  disabledReason,
  onRequestAppMention,
  onRequestPluginMention,
  placeholder = "Ask Codex to work in this thread",
  resolveLocalAttachment,
  threadId,
}: AgentComposerProps) {
  const composer = useAgentComposer(threadId);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | undefined>();
  const [isFocused, setFocused] = useState(false);
  const [isDragOver, setDragOver] = useState(false);
  const attachmentsRef = useRef<ComposerAttachment[]>([]);
  const dragCounter = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const revokePreview = useCallback((attachment: ComposerAttachment) => {
    if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
  }, []);

  const addAttachment = useCallback((attachment: ComposerAttachment) => {
    setAttachments((current) => [...current, attachment]);
  }, []);
  const removeAttachment = useCallback(
    (id: string) => {
      setAttachments((current) => {
        const removed = current.find((attachment) => attachment.id === id);
        if (removed) revokePreview(removed);
        return current.filter((attachment) => attachment.id !== id);
      });
    },
    [revokePreview],
  );
  const addLocalFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!resolveLocalAttachment) return;
      const list = Array.from(files);
      if (list.length === 0) return;
      let rejected = 0;
      for (const file of list) {
        const kind: AgentLocalAttachmentKind = isImageFile(file) ? "image" : "file";
        let input: CodexUserInput | CodexUserInput[] | null | undefined;
        try {
          input = await resolveLocalAttachment(file, kind);
        } catch (error) {
          console.warn("AgentComposer attachment resolver failed", error);
          setAttachmentError(error instanceof Error ? error.message : String(error));
          input = null;
        }
        if (!input) {
          rejected += 1;
          continue;
        }
        const previewUrl = kind === "image" ? URL.createObjectURL(file) : undefined;
        addAttachment({
          extension: fileExtension(file.name),
          id: `${kind}:${file.name}:${file.size}:${Date.now()}:${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          input,
          kind,
          label: file.name || kind,
          previewUrl,
          sizeLabel: formatFileSize(file.size),
          value: file.name,
        });
      }
      setAttachmentError(
        rejected > 0
          ? `${rejected} file${rejected === 1 ? "" : "s"} could not be attached for this Codex thread.`
          : undefined,
      );
    },
    [addAttachment, resolveLocalAttachment],
  );

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(
    () => () => {
      for (const attachment of attachmentsRef.current) revokePreview(attachment);
    },
    [revokePreview],
  );

  // Auto-resize textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [composer.value]);

  const submit = () => {
    if (disabled) return;
    if (!composer.value.trim() && attachments.length === 0) return;
    const pendingAttachments = attachments;
    deferAction(() => composer.submit(pendingAttachments.flatMap(composerAttachmentInput)));
    for (const attachment of pendingAttachments) revokePreview(attachment);
    setAttachments([]);
  };

  const isComposing = useRef(false);
  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !isComposing.current) {
      event.preventDefault();
      submit();
    }
  };

  const canSubmit = !disabled && (composer.value.trim().length > 0 || attachments.length > 0);

  const handleMention = useCallback(
    async (kind: "app" | "plugin") => {
      const resolver = kind === "app" ? onRequestAppMention : onRequestPluginMention;
      if (!resolver) return;
      let result: AgentComposerMentionAttachment | null | undefined;
      try {
        result = await Promise.resolve(resolver());
      } catch (error) {
        console.warn(`AgentComposer ${kind} mention resolver failed`, error);
        return;
      }
      if (!result) return;
      const label = result.label?.trim();
      const value = result.value?.trim();
      if (!label && !value) return;
      const finalLabel = label || value || kind;
      const finalValue = value || label || kind;
      addAttachment({
        id: result.id ?? `${kind}:${finalValue}:${Date.now()}`,
        input: result.input,
        kind,
        label: finalLabel,
        value: finalValue,
      });
    },
    [addAttachment, onRequestAppMention, onRequestPluginMention],
  );

  return (
    <form
      aria-label="Composer attachments"
      className="aui-composer"
      data-disabled={disabled ? "true" : undefined}
      data-focused={isFocused ? "true" : undefined}
      data-drag={isDragOver ? "true" : undefined}
      onDragEnter={(event) => {
        if (!resolveLocalAttachment || disabled) return;
        event.preventDefault();
        dragCounter.current += 1;
        if (dragCounter.current === 1) setDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!resolveLocalAttachment || disabled) return;
        event.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setDragOver(false);
        }
      }}
      onDragOver={(event) => {
        if (!resolveLocalAttachment || disabled) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (!resolveLocalAttachment || disabled) return;
        event.preventDefault();
        dragCounter.current = 0;
        setDragOver(false);
        const files = event.dataTransfer.files;
        if (files && files.length > 0) void addLocalFiles(files);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {disabled && disabledReason ? (
        <div className="aui-composer-notice" role="status">
          <IconShield size={14} />
          <span>{disabledReason}</span>
        </div>
      ) : null}
      {attachmentError ? (
        <div className="aui-composer-notice" data-tone="error" role="alert">
          <IconAlert size={14} />
          <span>{attachmentError}</span>
        </div>
      ) : null}
      {attachments.length > 0 ? (
        <ul className="aui-composer-chips" aria-label="Pending attachments">
          {attachments.map((attachment) => (
            <li className="aui-composer-chip" data-kind={attachment.kind} key={attachment.id}>
              {attachment.previewUrl ? (
                <img
                  alt=""
                  className="aui-composer-chip-thumbnail"
                  src={attachment.previewUrl}
                />
              ) : (
                <span className="aui-composer-chip-icon" aria-hidden="true">
                  {attachment.kind === "image" ? <IconImage size={14} /> : null}
                  {attachment.kind === "file" ? <IconPaperclip size={14} /> : null}
                  {attachment.kind === "app" ? <IconApp size={14} /> : null}
                  {attachment.kind === "plugin" ? <IconPlugin size={14} /> : null}
                </span>
              )}
              <span className="aui-composer-chip-copy">
                <span className="aui-composer-chip-label">{attachment.label}</span>
                {attachment.kind === "file" ? (
                  <span className="aui-composer-chip-meta">
                    {[attachment.extension, attachment.sizeLabel].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </span>
              <button
                aria-label={`Remove ${attachment.label}`}
                className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
                onClick={() => removeAttachment(attachment.id)}
                type="button"
              >
                <IconClose size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        aria-label="Message"
        className="aui-composer-input"
        disabled={disabled}
        onBlur={() => setFocused(false)}
        onChange={(event) => composer.setValue(event.currentTarget.value)}
        onCompositionEnd={() => {
          isComposing.current = false;
        }}
        onCompositionStart={() => {
          isComposing.current = true;
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={onKeyDown}
        onPaste={(event) => {
          if (disabled) return;
          if (!resolveLocalAttachment || event.clipboardData.files.length === 0) return;
          event.preventDefault();
          void addLocalFiles(event.clipboardData.files);
        }}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={composer.value}
      />
      <div className="aui-composer-toolbar">
        <div className="aui-composer-toolbar-start">
          <div className="aui-composer-toolbar-attach">
            {resolveLocalAttachment ? (
              <>
                <button
                  aria-label="Attach file"
                  className={buttonClass("ghost", { iconOnly: true })}
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach files"
                  type="button"
                >
                  <IconPaperclip size={16} />
                </button>
                <input
                  hidden
                  multiple
                  onChange={(event) => {
                    const files = event.currentTarget.files;
                    if (files) void addLocalFiles(files);
                    event.currentTarget.value = "";
                  }}
                  ref={fileInputRef}
                  type="file"
                />
              </>
            ) : null}
            {onRequestAppMention ? (
              <button
                aria-label="App"
                className={buttonClass("ghost", { size: "sm" })}
                disabled={disabled}
                onClick={() => void handleMention("app")}
                title="Mention an app"
                type="button"
              >
                <IconApp size={14} />
                <span>App</span>
              </button>
            ) : null}
            {onRequestPluginMention ? (
              <button
                aria-label="Plugin"
                className={buttonClass("ghost", { size: "sm" })}
                disabled={disabled}
                onClick={() => void handleMention("plugin")}
                title="Mention a plugin"
                type="button"
              >
                <IconPlugin size={14} />
                <span>Plugin</span>
              </button>
            ) : null}
          </div>
          <ComposerRunSettings />
        </div>
        <div className="aui-composer-toolbar-end">
          <span className="aui-composer-hint" aria-hidden="true">
            <kbd>Enter</kbd> to send
          </span>
          <button
            aria-label="Send"
            className={buttonClass("primary", { iconOnly: true, size: "lg" })}
            disabled={!canSubmit}
            title="Send message"
            type="submit"
          >
            <IconSend size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}

type ComposerAttachmentKind = "image" | "file" | "app" | "plugin";

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

export interface AgentComposerProps {
  disabled?: boolean;
  disabledReason?: string;
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  placeholder?: string;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  threadId?: string;
}

interface ComposerAttachment {
  extension?: string;
  id: string;
  input?: CodexUserInput | CodexUserInput[];
  kind: ComposerAttachmentKind;
  label: string;
  previewUrl?: string;
  sizeLabel?: string;
  value: string;
}

function composerAttachmentInput(attachment: ComposerAttachment): CodexUserInput[] {
  if (Array.isArray(attachment.input)) return attachment.input;
  if (attachment.input) return [attachment.input];
  return [mentionInput(attachment.label, attachment.value)];
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
  return `${Math.round(size / 1024 / 102.4) / 10} MB`;
}

function fileExtension(name: string): string | undefined {
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

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type) return false;
  const extension = fileExtension(file.name)?.toLowerCase();
  return extension ? IMAGE_ATTACHMENT_EXTENSIONS.has(extension) : false;
}

export interface AgentComposerPanelProps {
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  thread: ThreadState;
  threadId?: string;
}

export function AgentComposerPanel({
  onRequestAppMention,
  onRequestPluginMention,
  resolveLocalAttachment,
  thread,
  threadId,
}: AgentComposerPanelProps) {
  const isRunning = thread.status === "running";
  const isPreviewOnly = isPreviewOnlyThread(thread);
  const isBlocked = isRunning || thread.status === "waitingForInput" || isPreviewOnly;
  return (
    <section className="aui-compose-panel" aria-label="Message composer">
      <AgentComposer
        disabled={isBlocked}
        disabledReason={composerDisabledReason(thread.status, isPreviewOnly)}
        onRequestAppMention={onRequestAppMention}
        onRequestPluginMention={onRequestPluginMention}
        placeholder={composerPlaceholder(thread.status, isPreviewOnly)}
        resolveLocalAttachment={resolveLocalAttachment}
        threadId={threadId}
      />
    </section>
  );
}

function composerDisabledReason(
  status: ThreadState["status"],
  isPreviewOnly: boolean,
): string | undefined {
  if (isPreviewOnly) return "Resume this stored thread before sending a new message.";
  if (status === "running") return "Codex is working — send is available after the turn.";
  if (status === "waitingForInput") {
    return "Resolve the pending approval before sending another message.";
  }
  return undefined;
}

function isPreviewOnlyThread(thread: ThreadState): boolean {
  return (
    thread.status === "notLoaded" ||
    (thread.status === "loaded" && thread.orderedTurnIds.length > 0)
  );
}

function composerPlaceholder(status: ThreadState["status"], isPreviewOnly = false): string {
  if (isPreviewOnly) return "Stored thread";
  if (status === "running") return "Codex is working";
  if (status === "waitingForInput") return "Waiting on approval";
  return "Ask Codex to work in this thread";
}
