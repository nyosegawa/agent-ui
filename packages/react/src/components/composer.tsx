import type React from "react";
import type { ThreadState, ThreadTokenUsage } from "@nyosegawa/agent-ui-core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAgentComposer,
  type AgentComposerController,
} from "../hooks";
import { useAgentI18n } from "../i18n";
import type { CodexUserInput } from "../codex-request-params";
import {
  IconAlert,
  IconApp,
  IconClose,
  IconImage,
  IconPaperclip,
  IconPlugin,
  IconSend,
  IconShield,
  IconStop,
  buttonClass,
} from "../components-internal";
import { ComposerRunSettings } from "./run-settings";
import { deferAction } from "./shared";
import { AgentContextUsageIndicator } from "./context-usage";
import { QueuedFollowUpList } from "./follow-up-queue";
import {
  composerAttachmentInput,
  fileExtension,
  formatFileSize,
  isImageFile,
  type AgentComposerMentionAttachment,
  type AgentComposerMentionResolver,
  type AgentLocalAttachmentKind,
  type AgentLocalAttachmentResolver,
  type ComposerAttachment,
} from "./composer-attachments";

export type {
  AgentComposerMentionAttachment,
  AgentComposerMentionResolver,
  AgentLocalAttachmentKind,
  AgentLocalAttachmentResolver,
  AgentMentionAttachmentKind,
} from "./composer-attachments";

export function AgentComposer(props: AgentComposerProps) {
  const composer = useAgentComposer(props.threadId);
  const attachmentRestoreRef = useRef<((attachments: ComposerAttachment[]) => void) | null>(
    null,
  );
  return (
    <>
      <QueuedFollowUpList
        composer={composer}
        onRestoreAttachments={(attachments) => attachmentRestoreRef.current?.(attachments)}
      />
      <AgentComposerForm
        {...props}
        composer={composer}
        onRegisterAttachmentRestore={(restore) => {
          attachmentRestoreRef.current = restore;
        }}
      />
    </>
  );
}

function AgentComposerForm({
  composer,
  disabled = false,
  disabledReason,
  onRequestAppMention,
  onRequestPluginMention,
  placeholder,
  resolveLocalAttachment,
  tokenUsage,
  onRegisterAttachmentRestore,
}: AgentComposerProps & {
  composer: AgentComposerController;
  onRegisterAttachmentRestore?: (restore: (attachments: ComposerAttachment[]) => void) => void;
}) {
  const { t } = useAgentI18n();
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
  const restoreAttachments = useCallback(
    (restoredAttachments: ComposerAttachment[]) => {
      setAttachments((current) => {
        for (const attachment of current) revokePreview(attachment);
        return restoredAttachments;
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
          ? t("composer.attachmentRejected", {
              count: rejected,
              file: rejected === 1 ? "file" : "files",
            })
          : undefined,
      );
    },
    [addAttachment, resolveLocalAttachment, t],
  );

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    onRegisterAttachmentRestore?.(restoreAttachments);
  }, [onRegisterAttachmentRestore, restoreAttachments]);

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

  const submit = (mode: "normal" | "steer" = "normal") => {
    if (disabled) return;
    if (!composer.value.trim() && attachments.length === 0) {
      if (composer.isRunning) deferAction(() => composer.stop());
      return;
    }
    const pendingAttachments = attachments;
    deferAction(async () => {
      try {
        const input = pendingAttachments.flatMap(composerAttachmentInput);
        const result =
          mode === "steer"
            ? await composer.steerNow(input)
            : await composer.submit(input, { attachments: pendingAttachments });
        if (result !== "sent" && mode !== "steer") {
          setAttachments((current) =>
            current.filter((attachment) => !pendingAttachments.includes(attachment)),
          );
          return;
        }
      } catch {
        return;
      }
      for (const attachment of pendingAttachments) revokePreview(attachment);
      setAttachments((current) =>
        current.filter((attachment) => !pendingAttachments.includes(attachment)),
      );
    });
  };

  const isComposing = useRef(false);
  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !isComposing.current) {
      event.preventDefault();
      const wantsImmediateFollowUp = composer.isRunning && (event.metaKey || event.ctrlKey);
      submit(wantsImmediateFollowUp ? "steer" : "normal");
    }
  };

  const hasInput = composer.value.trim().length > 0 || attachments.length > 0;
  const isStopAction = composer.isRunning;
  const canSubmit =
    !disabled &&
    (composer.isRunning || hasInput) &&
    !composer.isSubmitting &&
    !composer.isInterrupting;

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
      aria-label={t("aria.composerAttachments")}
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
        if (composer.isRunning) deferAction(() => composer.stop());
        else submit();
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
      {composer.error ? (
        <div className="aui-composer-notice" data-tone="error" role="alert">
          <IconAlert size={14} />
          <span>{composer.error}</span>
        </div>
      ) : null}
      {attachments.length > 0 ? (
        <ul className="aui-composer-chips" aria-label={t("aria.pendingAttachments")}>
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
                aria-label={t("composer.removeAttachment", { label: attachment.label })}
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
        aria-label={t("aria.message")}
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
        placeholder={composer.isRunning ? t("composer.addFollowUp") : placeholder ?? t("composer.placeholder")}
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
                  aria-label={t("composer.attachFile")}
                  className={buttonClass("ghost", { iconOnly: true })}
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  title={t("composer.attachFiles")}
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
                aria-label={t("composer.app")}
                className={buttonClass("ghost", { size: "sm" })}
                disabled={disabled}
                onClick={() => void handleMention("app")}
                title={t("composer.mentionApp")}
                type="button"
              >
                <IconApp size={14} />
                <span>{t("composer.app")}</span>
              </button>
            ) : null}
            {onRequestPluginMention ? (
              <button
                aria-label={t("composer.plugin")}
                className={buttonClass("ghost", { size: "sm" })}
                disabled={disabled}
                onClick={() => void handleMention("plugin")}
                title={t("composer.mentionPlugin")}
                type="button"
              >
                <IconPlugin size={14} />
                <span>{t("composer.plugin")}</span>
              </button>
            ) : null}
          </div>
          <ComposerRunSettings />
        </div>
        <div className="aui-composer-toolbar-end">
          <AgentContextUsageIndicator tokenUsage={tokenUsage} />
          <span className="aui-composer-hint" aria-hidden="true">
            {t("composer.enterToSend")}
          </span>
          <button
            aria-label={isStopAction ? t("composer.stopCurrentTurn") : t("composer.send")}
            className={buttonClass(isStopAction ? "danger" : "primary", {
              iconOnly: true,
              size: "lg",
            })}
            disabled={!canSubmit}
            title={isStopAction ? t("composer.stopCurrentTurn") : t("composer.sendMessage")}
            type="submit"
          >
            {isStopAction ? <IconStop size={18} /> : <IconSend size={18} />}
          </button>
        </div>
      </div>
    </form>
  );
}

export interface AgentComposerProps {
  disabled?: boolean;
  disabledReason?: string;
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  placeholder?: string;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  tokenUsage?: ThreadTokenUsage;
  threadId?: string;
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
  const { t } = useAgentI18n();
  const isPreviewOnly = isPreviewOnlyThread(thread);
  const isBlocked = thread.status === "waitingForInput" || isPreviewOnly;
  const composer = useAgentComposer(threadId);
  const attachmentRestoreRef = useRef<((attachments: ComposerAttachment[]) => void) | null>(
    null,
  );
  return (
    <section className="aui-compose-panel" aria-label={t("aria.messageComposer")}>
      <QueuedFollowUpList
        composer={composer}
        onRestoreAttachments={(attachments) => attachmentRestoreRef.current?.(attachments)}
      />
      <AgentComposerForm
        composer={composer}
        disabled={isBlocked}
        disabledReason={composerDisabledReason(thread.status, isPreviewOnly, t)}
        onRegisterAttachmentRestore={(restore) => {
          attachmentRestoreRef.current = restore;
        }}
        onRequestAppMention={onRequestAppMention}
        onRequestPluginMention={onRequestPluginMention}
        placeholder={composerPlaceholder(thread.status, isPreviewOnly, t)}
        resolveLocalAttachment={resolveLocalAttachment}
        tokenUsage={thread.tokenUsage}
        threadId={threadId}
      />
    </section>
  );
}

function composerDisabledReason(
  status: ThreadState["status"],
  isPreviewOnly: boolean,
  t: ReturnType<typeof useAgentI18n>["t"],
): string | undefined {
  if (isPreviewOnly) return t("composer.previewOnlyReason");
  if (status === "waitingForInput") {
    return t("composer.resolveApprovalReason");
  }
  return undefined;
}

function isPreviewOnlyThread(thread: ThreadState): boolean {
  return (
    thread.status === "notLoaded" ||
    (thread.status === "loaded" && thread.orderedTurnIds.length > 0)
  );
}

function composerPlaceholder(
  status: ThreadState["status"],
  isPreviewOnly: boolean,
  t: ReturnType<typeof useAgentI18n>["t"],
): string {
  if (isPreviewOnly) return t("thread.status.stored");
  if (status === "running") return t("composer.addFollowUp");
  if (status === "waitingForInput") return t("thread.status.needsApproval");
  return t("composer.placeholder");
}
