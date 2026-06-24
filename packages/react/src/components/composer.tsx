import React from "react";
import type { ThreadState, ThreadTokenUsage } from "@nyosegawa/agent-ui-core";
import { useEffect, useId, useRef, useState } from "react";
import { type AgentComposerController } from "../hooks";
import { useInternalAgentComposerController } from "../hooks/composer";
import { useAgentI18n } from "../i18n";
import type { AgentResourceKind } from "../resources";
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
import { AgentComposerSubmitButton } from "./composer-submit-button";
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
  AgentResolvedLocalAttachment,
  AgentMentionAttachmentKind,
} from "./composer-attachments";
export type { AgentComposerSubmitButtonProps } from "./composer-submit-button";
export { AgentComposerSubmitButton } from "./composer-submit-button";

export type AgentAttachmentChipKind = Extract<
  AgentResourceKind,
  "image" | "file" | "app" | "plugin"
>;

export interface AgentAttachmentChip {
  extension?: string;
  id: string;
  kind: AgentAttachmentChipKind;
  label: string;
  previewFailed?: boolean;
  previewUrl?: string;
  sizeLabel?: string;
}

export interface AgentAttachmentChipsProps {
  attachments: readonly AgentAttachmentChip[];
  onPreviewFailed?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function AgentAttachmentChips({
  attachments,
  onPreviewFailed,
  onRemove,
}: AgentAttachmentChipsProps) {
  const { t } = useAgentI18n();
  if (attachments.length === 0) return null;
  return (
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
          data-preview-status={
            attachment.previewUrl
              ? attachment.previewFailed
                ? "failed"
                : "ready"
              : "none"
          }
          key={attachment.id}
        >
          {attachment.previewUrl && !attachment.previewFailed ? (
            <img
              alt=""
              className="aui-composer-chip-thumbnail"
              onError={() => onPreviewFailed?.(attachment.id)}
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
          {onRemove ? (
            <button
              aria-label={t("composer.removeAttachment", { label: attachment.label })}
              className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
              onClick={() => onRemove(attachment.id)}
              type="button"
            >
              <IconClose size={12} />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export interface AgentComposerInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  shortcutHintId?: string;
}

export const AgentComposerInput = React.forwardRef<
  HTMLTextAreaElement,
  AgentComposerInputProps
>(function AgentComposerInput({ className, shortcutHintId, ...props }, ref) {
  const describedBy = Array.from(
    new Set(
      [props["aria-describedby"], shortcutHintId]
        .flatMap((value) => value?.split(/\s+/) ?? [])
        .filter(Boolean),
    ),
  ).join(" ");
  return (
    <textarea
      {...props}
      aria-describedby={describedBy || undefined}
      className={["aui-composer-input", className].filter(Boolean).join(" ")}
      ref={ref}
    />
  );
});

export interface AgentComposerToolbarProps {
  className?: string;
  end?: React.ReactNode;
  start?: React.ReactNode;
}

export function AgentComposerToolbar({
  className,
  end,
  start,
}: AgentComposerToolbarProps) {
  return (
    <div className={["aui-composer-toolbar", className].filter(Boolean).join(" ")}>
      <div className="aui-composer-toolbar-start">{start}</div>
      <div className="aui-composer-toolbar-end">{end}</div>
    </div>
  );
}

export function AgentComposer(props: AgentComposerProps) {
  const composer = useInternalAgentComposerController(props.threadId);
  const { t } = useAgentI18n();
  const attachmentRestoreRef = useRef<
    ((attachments: ComposerAttachment[]) => void) | null
  >(null);
  const isApprovalBlocked = composer.disabledReason === "approval";
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
        disabled={props.disabled ?? isApprovalBlocked}
        disabledReason={
          props.disabledReason ??
          (isApprovalBlocked ? t("composer.resolveApprovalReason") : undefined)
        }
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
    markAttachmentPreviewFailed,
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
          if (!result) return;
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
      <AgentAttachmentChips
        attachments={attachments}
        onPreviewFailed={markAttachmentPreviewFailed}
        onRemove={removeAttachment}
      />
      <AgentComposerInput
        aria-describedby={shortcutHintId}
        aria-label={t("aria.message")}
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
        shortcutHintId={shortcutHintId}
        value={composer.value}
      />
      <AgentComposerToolbar
        start={
          <>
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
          </>
        }
        end={
          <>
            <AgentContextUsageIndicator tokenUsage={tokenUsage} />
            <span className="aui-composer-hint" id={shortcutHintId}>
              {t("composer.enterToSend")}
            </span>
            <AgentComposerSubmitButton
              canSubmit={canSubmit}
              isStopAction={isStopAction}
            />
          </>
        }
      />
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
  const isBlocked = thread.activity === "waitingForInput";
  const composer = useInternalAgentComposerController(threadId);
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
        disabledReason={composerDisabledReason(thread.activity, t)}
        onRegisterAttachmentRestore={(restore) => {
          attachmentRestoreRef.current = restore;
        }}
        onRequestAppMention={onRequestAppMention}
        onRequestPluginMention={onRequestPluginMention}
        placeholder={composerPlaceholder(thread.activity, t)}
        resolveLocalAttachment={resolveLocalAttachment}
        tokenUsage={thread.tokenUsage}
        threadId={threadId}
      />
    </section>
  );
}

function composerDisabledReason(
  activity: ThreadState["activity"],
  t: ReturnType<typeof useAgentI18n>["t"],
): string | undefined {
  if (activity === "waitingForInput") {
    return t("composer.resolveApprovalReason");
  }
  return undefined;
}

function composerPlaceholder(
  activity: ThreadState["activity"],
  t: ReturnType<typeof useAgentI18n>["t"],
): string {
  if (activity === "running") return t("composer.addFollowUp");
  if (activity === "waitingForInput") return t("thread.status.needsApproval");
  return t("composer.placeholder");
}
