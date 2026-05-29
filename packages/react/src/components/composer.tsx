import type React from "react";
import type { ThreadState, ThreadTokenUsage } from "@nyosegawa/agent-ui-core";
import { useEffect, useId, useRef, useState } from "react";
import { useAgentComposer, type AgentComposerController } from "../hooks";
import { useAgentI18n } from "../i18n";
import {
  IconAlert,
  IconApp,
  IconClose,
  IconImage,
  IconPaperclip,
  IconPlugin,
  IconShield,
  buttonClass,
} from "../components-internal";
import { ComposerSubmitButton } from "./composer-submit-button";
import { ComposerRunSettings } from "./run-settings";
import { deferAction } from "./shared";
import { AgentContextUsageIndicator } from "./context-usage";
import { QueuedFollowUpList } from "./follow-up-queue";
import { useComposerAttachmentState } from "./composer-attachment-state";
import { useComposerDropZone } from "./composer-drag-drop";
import { useComposerMentionActions } from "./composer-mentions";
import {
  composerSubmitModeForEnter,
  shouldSubmitOnComposerEnter,
  type ComposerSubmitMode,
} from "./composer-submit-semantics";
import {
  composerAttachmentInput,
  type AgentComposerMentionResolver,
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
  const attachmentRestoreRef = useRef<
    ((attachments: ComposerAttachment[]) => void) | null
  >(null);
  return (
    <>
      <QueuedFollowUpList
        composer={composer}
        onRestoreAttachments={(attachments) =>
          attachmentRestoreRef.current?.(attachments)
        }
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
  onRegisterAttachmentRestore?: (
    restore: (attachments: ComposerAttachment[]) => void,
  ) => void;
}) {
  const { t } = useAgentI18n();
  const shortcutHintId = useId();
  const [isFocused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    addAttachment,
    addLocalFiles,
    attachmentError,
    attachments,
    clearSubmittedAttachments,
    removeAttachment,
  } = useComposerAttachmentState({
    onRegisterAttachmentRestore,
    resolveLocalAttachment,
    t,
  });
  const dropZone = useComposerDropZone({
    addLocalFiles,
    disabled,
    enabled: Boolean(resolveLocalAttachment),
  });
  const handleMention = useComposerMentionActions({
    addAttachment,
    onRequestAppMention,
    onRequestPluginMention,
  });

  // Auto-resize textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [composer.value]);

  const submit = (mode: ComposerSubmitMode = "normal") => {
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
          clearSubmittedAttachments(pendingAttachments);
          return;
        }
      } catch {
        return;
      }
      clearSubmittedAttachments(pendingAttachments, { revokePreview: true });
    });
  };

  const isComposing = useRef(false);
  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (
      shouldSubmitOnComposerEnter({
        isComposing: isComposing.current,
        key: event.key,
        shiftKey: event.shiftKey,
      })
    ) {
      event.preventDefault();
      submit(
        composerSubmitModeForEnter({
          ctrlKey: event.ctrlKey,
          isRunning: composer.isRunning,
          metaKey: event.metaKey,
        }),
      );
    }
  };

  const hasInput = composer.value.trim().length > 0 || attachments.length > 0;
  const isStopAction = composer.isRunning;
  const canSubmit =
    !disabled &&
    (composer.isRunning || hasInput) &&
    !composer.isSubmitting &&
    !composer.isInterrupting;

  return (
    <form
      aria-label={t("aria.messageComposer")}
      className="aui-composer"
      data-disabled={disabled ? "true" : undefined}
      data-focused={isFocused ? "true" : undefined}
      data-drag={dropZone.isDragOver ? "true" : undefined}
      onDragEnter={dropZone.onDragEnter}
      onDragLeave={dropZone.onDragLeave}
      onDragOver={dropZone.onDragOver}
      onDrop={dropZone.onDrop}
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
            <li
              aria-label={[
                attachment.label,
                attachment.kind === "file" ? attachment.extension : undefined,
                attachment.kind === "file" ? attachment.sizeLabel : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              className="aui-composer-chip"
              data-kind={attachment.kind}
              key={attachment.id}
            >
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
                    {[attachment.extension, attachment.sizeLabel]
                      .filter(Boolean)
                      .join(" · ")}
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
        aria-describedby={shortcutHintId}
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
        placeholder={
          composer.isRunning
            ? t("composer.addFollowUp")
            : (placeholder ?? t("composer.placeholder"))
        }
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
                  aria-label={t("composer.attachFiles")}
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
          <span className="aui-composer-hint" id={shortcutHintId}>
            {t("composer.enterToSend")}
          </span>
          <ComposerSubmitButton canSubmit={canSubmit} isStopAction={isStopAction} />
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
  const attachmentRestoreRef = useRef<
    ((attachments: ComposerAttachment[]) => void) | null
  >(null);
  return (
    <section className="aui-compose-panel" aria-label={t("aria.messageComposer")}>
      <QueuedFollowUpList
        composer={composer}
        onRestoreAttachments={(attachments) =>
          attachmentRestoreRef.current?.(attachments)
        }
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
