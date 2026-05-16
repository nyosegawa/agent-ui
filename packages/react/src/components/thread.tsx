import type React from "react";
import type {
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import {
  useAgentApprovals,
  useAgentThread,
  useAgentThreadActions,
  useAgentTurn,
} from "../hooks";
import {
  IconAdd,
  IconMoreVertical,
  IconStop,
  buttonClass,
} from "../components-internal";
import { AgentMessageList } from "../timeline";
import { AgentApprovalQueue } from "./approvals";
import {
  AgentComposerPanel,
  type AgentComposerMentionResolver,
  type AgentLocalAttachmentResolver,
} from "./composer";
import { AgentCriticalNoticeList, AgentTokenUsageBar } from "./status";
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
  return (
    <div className="aui-thread-header">
      <div className="aui-thread-title">
        <h1>{thread.thread.name ?? "Untitled thread"}</h1>
        <p>{threadSubtitle(thread.thread)}</p>
        {thread.tokenUsage ? <AgentTokenUsageBar {...thread.tokenUsage} /> : null}
      </div>
      <AgentThreadActions thread={thread} threadId={threadId} />
    </div>
  );
}

/**
 * Renders the thread transcript. When a `threadId` is supplied, pending
 * approvals for that thread are appended to the end of the transcript as a
 * pending-decision item — they are part of the scroll area, not a separate
 * pane stacked above the composer.
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
  return (
    <AgentMessageList
      footer={
        approvals.length > 0 ? (
          <AgentApprovalQueue
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
  const { resumeThread, startThread } = useAgentThread(threadId);
  const {
    archiveThread,
    compactThread,
    forkThread,
    renameThread,
    rollbackThread,
    unarchiveThread,
  } = useAgentThreadActions(threadId);
  const { interruptTurn } = useAgentTurn(threadId);
  const status = thread.status;
  const latestTurnId = thread.orderedTurnIds.at(-1);
  const hasTurns = thread.orderedTurnIds.length > 0;
  const canResume = threadId && (status === "notLoaded" || status === "loaded");
  return (
    <div className="aui-thread-actions">
      <span className="aui-status-pill" data-status={status}>
        <span className="aui-status-pill-dot" aria-hidden="true" />
        {formatThreadStatus(status, { hasTurns })}
      </span>
      {canResume ? (
        <button
          className={buttonClass("secondary", { size: "sm" })}
          onClick={() =>
            deferAction(() => void resumeThread(threadId, { excludeTurns: true }))
          }
          type="button"
        >
          Resume
        </button>
      ) : null}
      {status === "running" && latestTurnId ? (
        <button
          className={buttonClass("danger", { size: "sm" })}
          onClick={() => deferAction(() => void interruptTurn(latestTurnId))}
          type="button"
        >
          <IconStop size={12} />
          <span>Stop</span>
        </button>
      ) : null}
      <button
        aria-label="New thread"
        className={buttonClass("ghost", { size: "sm" })}
        onClick={() => deferAction(startThread)}
        title="New thread"
        type="button"
      >
        <IconAdd size={14} />
        <span>New thread</span>
      </button>
      <details className="aui-thread-action-menu">
        <summary aria-label="Actions" title="Thread actions">
          <IconMoreVertical size={16} />
        </summary>
        <div>
          <button
            disabled={!threadId}
            onClick={() => {
              const name = globalThis.prompt?.("Thread name", thread.thread.name ?? "");
              if (name?.trim()) deferAction(() => void renameThread(name.trim()));
            }}
            type="button"
          >
            Rename
          </button>
          <button
            disabled={!threadId}
            onClick={() => deferAction(() => void forkThread())}
            type="button"
          >
            Fork
          </button>
          <button
            disabled={!threadId || status === "archived"}
            onClick={() => deferAction(() => void archiveThread())}
            type="button"
          >
            Archive
          </button>
          <button
            disabled={!threadId || status !== "archived"}
            onClick={() => deferAction(() => void unarchiveThread())}
            type="button"
          >
            Unarchive
          </button>
          <button
            disabled={!threadId || !hasTurns}
            onClick={() => deferAction(() => void compactThread())}
            type="button"
          >
            Compact
          </button>
          <button
            disabled={!threadId || !hasTurns}
            onClick={() => deferAction(() => void rollbackThread(1))}
            type="button"
          >
            Rollback
          </button>
        </div>
      </details>
    </div>
  );
}
