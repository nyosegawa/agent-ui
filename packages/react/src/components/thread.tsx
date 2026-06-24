import type React from "react";
import { useMemo } from "react";
import type {
  AgentThreadSummaryView,
  AgentThreadTranscriptView,
  PendingServerRequest,
} from "@nyosegawa/agent-ui-core";
import {
  selectActiveThreadSummaryView,
  selectThreadSummaryView,
  selectThreadTranscriptView,
} from "@nyosegawa/agent-ui-core";
import { useAgentApprovals, useAgentThread, useAgentThreadActions } from "../hooks";
import { useAgentI18n } from "../i18n";
import { IconMoreVertical } from "../components-internal";
import { AgentMessageList } from "../timeline";
import type { AgentLocalMediaUrlResolver } from "../timeline";
import type { AgentComponents, AgentApprovalDefaultProps } from "./chat";
import { AgentApprovalQueue } from "./approvals";
import {
  AgentComposerPanel,
  type AgentComposerMentionResolver,
  type AgentLocalAttachmentResolver,
} from "./composer";
import { AgentCriticalNoticeList } from "./status";
import { deferAction } from "./shared";
import { formatThreadStatus } from "./sidebar";
import { useAgentContext } from "../provider";

export interface AgentThreadViewProps {
  components?: AgentComponents;
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: React.ComponentProps<typeof AgentMessageList>["renderItem"];
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  threadId?: string;
}

export function AgentThreadView({
  components,
  onRequestAppMention,
  onRequestPluginMention,
  renderApproval,
  renderItem,
  resolveLocalAttachment,
  resolveLocalMediaUrl,
  threadId,
}: AgentThreadViewProps) {
  const { thread, threadId: resolvedThreadId } = useAgentThread(threadId);
  const { state } = useAgentContext();
  const threadView = resolvedThreadId
    ? selectThreadSummaryView(state, resolvedThreadId)
    : selectActiveThreadSummaryView(state);
  const transcriptView = resolvedThreadId
    ? selectThreadTranscriptView(state, resolvedThreadId)
    : undefined;
  if (!thread) return null;
  const ComposerPanel = components?.ComposerPanel;
  return (
    <AgentThreadSurface>
      {threadView ? (
        <AgentThreadHeader
          thread={threadView}
          threadId={resolvedThreadId}
          transcript={transcriptView}
        />
      ) : null}
      <AgentCriticalNoticeList />
      <AgentThreadTimeline
        components={components}
        renderApproval={renderApproval}
        renderItem={renderItem}
        resolveLocalMediaUrl={resolveLocalMediaUrl}
        threadId={resolvedThreadId}
      />
      {ComposerPanel ? (
        <ComposerPanel
          Default={AgentComposerPanel}
          onRequestAppMention={onRequestAppMention}
          onRequestPluginMention={onRequestPluginMention}
          resolveLocalAttachment={resolveLocalAttachment}
          thread={thread}
          threadId={resolvedThreadId}
        />
      ) : (
        <AgentComposerPanel
          onRequestAppMention={onRequestAppMention}
          onRequestPluginMention={onRequestPluginMention}
          resolveLocalAttachment={resolveLocalAttachment}
          thread={thread}
          threadId={resolvedThreadId}
        />
      )}
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
  transcript,
}: {
  thread: AgentThreadSummaryView;
  threadId?: string;
  transcript?: AgentThreadTranscriptView;
}) {
  const { t } = useAgentI18n();
  return (
    <div className="aui-thread-header">
      <div className="aui-thread-title">
        <h1>{thread.title || t("thread.untitled")}</h1>
        <p>{thread.subtitle ?? thread.cwd ?? thread.id}</p>
      </div>
      <AgentThreadActions thread={thread} threadId={threadId} transcript={transcript} />
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
  components,
  renderApproval,
  renderItem,
  resolveLocalMediaUrl,
  threadId,
}: {
  components?: AgentComponents;
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: React.ComponentProps<typeof AgentMessageList>["renderItem"];
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  threadId?: string;
}) {
  const { state } = useAgentContext();
  const { approvals } = useAgentApprovals(threadId);
  const transcript = threadId ? selectThreadTranscriptView(state, threadId) : undefined;
  const Approval = components?.Approval;
  const renderApprovalComponent =
    Approval || renderApproval
      ? (approval: PendingServerRequest) => {
          if (!Approval) return renderApproval?.(approval);
          function DefaultApproval({ approval: defaultApproval }: AgentApprovalDefaultProps) {
            return (
              <AgentApprovalQueue
                approvals={[defaultApproval]}
                threadId={threadId}
              />
            );
          }
          return <Approval approval={approval} Default={DefaultApproval} />;
        }
      : undefined;
  const approvalPlacement = useMemo(
    () => placeTranscriptApprovals(approvals, transcript),
    [approvals, transcript],
  );
  if (!threadId) return null;
  return (
    <AgentMessageList
      approvalAnchors={
        approvalPlacement.anchored.length > 0
          ? {
              requests: approvalPlacement.anchored,
              renderApprovalAnchor: (approval) => (
                <AgentApprovalQueue
                  approvals={[approval]}
                  renderApproval={renderApprovalComponent}
                  threadId={threadId}
                />
              ),
            }
          : undefined
      }
      footer={
        approvalPlacement.tail.length > 0 ? (
          <AgentApprovalQueue
            approvals={approvalPlacement.tail}
            renderApproval={renderApprovalComponent}
            threadId={threadId}
          />
        ) : undefined
      }
      components={components}
      renderItem={renderItem}
      resolveLocalMediaUrl={resolveLocalMediaUrl}
      scrollKey={approvals.length}
      threadId={threadId}
    />
  );
}

function placeTranscriptApprovals(
  approvals: PendingServerRequest[],
  transcript: AgentThreadTranscriptView | undefined,
): {
  anchored: PendingServerRequest[];
  tail: PendingServerRequest[];
} {
  const anchored: PendingServerRequest[] = [];
  const tail: PendingServerRequest[] = [];
  for (const approval of approvals) {
    if (transcriptApprovalExists(approval, transcript)) {
      anchored.push(approval);
    } else {
      tail.push(approval);
    }
  }
  return { anchored, tail };
}

function transcriptApprovalExists(
  approval: PendingServerRequest,
  transcript: AgentThreadTranscriptView | undefined,
): boolean {
  if (!transcript || (!approval.itemId && !approval.turnId)) return false;
  if (approval.itemId) {
    return transcript.turns.some((turn) =>
      turn.itemIds.includes(approval.itemId!),
    );
  }
  return transcript.turns.some((turn) => turn.id === approval.turnId);
}

function AgentThreadActions({
  thread,
  threadId,
  transcript,
}: {
  thread: AgentThreadSummaryView;
  threadId?: string;
  transcript?: AgentThreadTranscriptView;
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
  const status = statusForThreadView(thread);
  const hasTurns = (transcript?.turns.length ?? 0) > 0;
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
                thread.title,
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

function statusForThreadView(thread: AgentThreadSummaryView) {
  if (thread.displayStatus === "preview") return "loaded";
  if (thread.displayStatus === "failed") return "failed";
  return thread.displayStatus;
}
