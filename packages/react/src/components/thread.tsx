import type React from "react";
import type {
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import { useState } from "react";
import {
  useAgentApprovals,
  useAgentThread,
  useAgentThreadActions,
} from "../hooks";
import { useAgentI18n } from "../i18n";
import { useAgentContext } from "../provider";
import {
  IconAdd,
  IconMoreVertical,
  buttonClass,
} from "../components-internal";
import { AgentMessageList } from "../timeline";
import { AgentApprovalQueue } from "./approvals";
import {
  AgentComposerPanel,
  type AgentComposerMentionResolver,
  type AgentLocalAttachmentResolver,
} from "./composer";
import { AgentCriticalNoticeList } from "./status";
import { deferAction } from "./shared";
import { formatThreadStatus, threadSubtitle } from "./sidebar";

export interface AgentThreadViewProps {
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  threadId?: string;
}

export function AgentThreadView({
  onRequestAppMention,
  onRequestPluginMention,
  renderApproval,
  renderItem,
  resolveLocalAttachment,
  threadId,
}: AgentThreadViewProps) {
  const { thread, threadId: resolvedThreadId } = useAgentThread(threadId);
  if (!thread) return null;
  return (
    <AgentThreadSurface>
      <AgentThreadHeader thread={thread} threadId={resolvedThreadId} />
      <AgentCriticalNoticeList />
      <AgentThreadTimeline
        renderApproval={renderApproval}
        renderItem={renderItem}
        thread={thread}
        threadId={resolvedThreadId}
      />
      <AgentComposerPanel
        onRequestAppMention={onRequestAppMention}
        onRequestPluginMention={onRequestPluginMention}
        resolveLocalAttachment={resolveLocalAttachment}
        thread={thread}
        threadId={resolvedThreadId}
      />
    </AgentThreadSurface>
  );
}

export function AgentThreadSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["aui-thread-surface", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export function AgentThreadHeader({
  thread,
  threadId,
}: {
  thread: ThreadState;
  threadId?: string;
}) {
  const { t } = useAgentI18n();
  return (
    <div className="aui-thread-header">
      <div className="aui-thread-title">
        <h1>{thread.thread.name ?? t("thread.untitled")}</h1>
        <p>{threadSubtitle(thread.thread, t)}</p>
      </div>
      <AgentThreadActions thread={thread} threadId={threadId} />
    </div>
  );
}

/**
 * Renders the thread transcript. When a `threadId` is supplied, pending
 * approvals with upstream item or turn metadata are anchored immediately after
 * that transcript context. Metadata-free approvals fall back to the transcript
 * tail so they stay in the scroll area, not a separate pane above the composer.
 */
export function AgentThreadTimeline({
  renderApproval,
  renderItem,
  thread,
  threadId,
}: {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  thread: ThreadState;
  threadId?: string;
}) {
  const approvalThreadId = threadId ?? thread.thread.id;
  const { approvals } = useAgentApprovals(approvalThreadId);
  const anchoredApprovals = approvals.filter((approval) => approval.itemId || approval.turnId);
  const tailApprovals = approvals.filter((approval) => !approval.itemId && !approval.turnId);
  return (
    <AgentMessageList
      approvalAnchors={
        anchoredApprovals.length > 0
          ? {
              requests: anchoredApprovals,
              renderApprovalAnchor: (approval) => (
                <AgentApprovalQueue
                  approvals={[approval]}
                  renderApproval={renderApproval}
                  threadId={approvalThreadId}
                />
              ),
            }
          : undefined
      }
      footer={
        tailApprovals.length > 0 ? (
          <AgentApprovalQueue
            approvals={tailApprovals}
            renderApproval={renderApproval}
            threadId={approvalThreadId}
          />
        ) : undefined
      }
      renderItem={renderItem}
      scrollKey={approvals.length}
      thread={thread}
    />
  );
}

function AgentThreadActions({
  thread,
  threadId,
}: {
  thread: ThreadState;
  threadId?: string;
}) {
  const { t } = useAgentI18n();
  const { resumeThread, startThread } = useAgentThread(threadId);
  const { dispatch } = useAgentContext();
  const [resumeError, setResumeError] = useState<string | undefined>();
  const {
    archiveThread,
    compactThread,
    forkThread,
    renameThread,
    rollbackThread,
    unarchiveThread,
  } = useAgentThreadActions(threadId);
  const status = thread.status;
  const hasTurns = thread.orderedTurnIds.length > 0;
  const canResume = threadId && (status === "notLoaded" || status === "loaded");
  return (
    <div className="aui-thread-actions">
      <span className="aui-status-pill" data-status={status}>
        <span className="aui-status-pill-dot" aria-hidden="true" />
        {formatThreadStatus(status, { hasTurns, t })}
      </span>
      {canResume ? (
        <button
          className={buttonClass("secondary", { size: "sm" })}
          onClick={() => {
            setResumeError(undefined);
            deferAction(async () => {
              try {
                await resumeThread(threadId);
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : String(error);
                setResumeError(message);
                dispatch({
                  error: { message: `Resume failed: ${message}` },
                  type: "error/added",
                });
              }
            });
          }}
          type="button"
        >
          {t("thread.resume")}
        </button>
      ) : null}
      <button
        aria-label={t("thread.new")}
        className={buttonClass("ghost", { size: "sm" })}
        onClick={() => deferAction(startThread)}
        title={t("thread.new")}
        type="button"
      >
        <IconAdd size={14} />
        <span>{t("thread.new")}</span>
      </button>
      <details className="aui-thread-action-menu">
        <summary aria-label={t("aria.actions")} title={t("aria.actions")}>
          <IconMoreVertical size={16} />
        </summary>
        <div>
          <button
            disabled={!threadId}
            onClick={() => {
              const name = globalThis.prompt?.(t("thread.namePrompt"), thread.thread.name ?? "");
              if (name?.trim()) deferAction(() => void renameThread(name.trim()));
            }}
            type="button"
          >
            {t("thread.action.rename")}
          </button>
          <button
            disabled={!threadId}
            onClick={() => deferAction(() => void forkThread())}
            type="button"
          >
            {t("thread.action.fork")}
          </button>
          <button
            disabled={!threadId || status === "archived"}
            onClick={() => deferAction(() => void archiveThread())}
            type="button"
          >
            {t("thread.action.archive")}
          </button>
          <button
            disabled={!threadId || status !== "archived"}
            onClick={() => deferAction(() => void unarchiveThread())}
            type="button"
          >
            {t("thread.action.unarchive")}
          </button>
          <button
            disabled={!threadId || !hasTurns}
            onClick={() => deferAction(() => void compactThread())}
            type="button"
          >
            {t("thread.action.compact")}
          </button>
          <button
            disabled={!threadId || !hasTurns}
            onClick={() => deferAction(() => void rollbackThread(1))}
            type="button"
          >
            {t("thread.action.rollback")}
          </button>
        </div>
      </details>
      {resumeError ? (
        <div className="aui-thread-action-error" role="alert">
          {t("thread.resumeFailed", { message: resumeError })}
        </div>
      ) : null}
    </div>
  );
}
