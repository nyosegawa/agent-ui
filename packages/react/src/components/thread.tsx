import type React from "react";
import { useMemo } from "react";
import type {
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import { useAgentApprovals, useAgentThread, useAgentThreadActions } from "../hooks";
import { useAgentI18n } from "../i18n";
import { IconMoreVertical } from "../components-internal";
import { AgentMessageList } from "../timeline";
import { AgentApprovalQueue } from "./approvals";
import {
  transcriptItemIds,
} from "../transcript-window";
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
  const approvalPlacement = useMemo(
    () => placeTranscriptApprovals(thread, approvals),
    [approvals, thread],
  );
  return (
    <AgentMessageList
      approvalAnchors={
        approvalPlacement.anchored.length > 0
          ? {
              requests: approvalPlacement.anchored,
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
        approvalPlacement.tail.length > 0 ? (
          <AgentApprovalQueue
            approvals={approvalPlacement.tail}
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

function placeTranscriptApprovals(
  thread: ThreadState,
  approvals: PendingServerRequest[],
): {
  anchored: PendingServerRequest[];
  tail: PendingServerRequest[];
} {
  const anchored: PendingServerRequest[] = [];
  const tail: PendingServerRequest[] = [];
  for (const approval of approvals) {
    const source = transcriptApprovalSource(thread, approval);
    if (!source) {
      tail.push(approval);
      continue;
    }
    anchored.push(approval);
  }
  return { anchored, tail };
}

function transcriptApprovalSource(
  thread: ThreadState,
  approval: PendingServerRequest,
): { itemId?: string; turnId: string } | undefined {
  if (!approval.itemId && !approval.turnId) return undefined;
  const turns = approval.turnId
    ? [thread.turns[approval.turnId]].filter((turn) => turn != null)
    : thread.orderedTurnIds.map((turnId) => thread.turns[turnId]).filter((turn) => turn != null);
  if (turns.length === 0) return undefined;
  if (approval.itemId) {
    const turn = turns.find((candidate) =>
      transcriptItemIds(candidate).includes(approval.itemId!),
    );
    return turn ? { itemId: approval.itemId, turnId: turn.turn.id } : undefined;
  }
  const turn = turns[0];
  if (!turn) return undefined;
  const itemIds = transcriptItemIds(turn);
  if (itemIds.length === 0) return undefined;
  return { itemId: itemIds.at(-1), turnId: turn.turn.id };
}

function AgentThreadActions({
  thread,
  threadId,
}: {
  thread: ThreadState;
  threadId?: string;
}) {
  const { t } = useAgentI18n();
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
  return (
    <div className="aui-thread-actions">
      <span className="aui-status-pill" data-status={status}>
        <span className="aui-status-pill-dot" aria-hidden="true" />
        {formatThreadStatus(status, { hasTurns, t })}
      </span>
      <details className="aui-thread-action-menu">
        <summary aria-label={t("aria.actions")} title={t("aria.actions")}>
          <IconMoreVertical size={16} />
        </summary>
        <div>
          <button
            disabled={!threadId}
            onClick={() => {
              const name = globalThis.prompt?.(
                t("thread.namePrompt"),
                thread.thread.name ?? "",
              );
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
    </div>
  );
}
