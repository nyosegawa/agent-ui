import type { AgentItemState, ThreadState, TurnState } from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useMemo, useState } from "react";
import { useAgentI18n } from "./i18n";
import {
  DEFAULT_TRANSCRIPT_ITEM_LIMIT,
  TRANSCRIPT_ITEM_INCREMENT,
  transcriptItemIds,
  visibleTranscriptWindow,
} from "./transcript-window";
import {
  anchoredApprovalNodes,
  approvalAnchorsForTurn,
  type ApprovalAnchors,
  type TranscriptApprovalAnchors,
} from "./timeline/approval-anchors";
import { blockForTranscriptItem } from "./timeline/blocks";
import {
  displayItemStatus,
  displayText,
} from "./timeline/formatters";
import {
  AgentContentBlockView,
  AgentMessageItem,
  localizedItemLabel,
} from "./timeline/item-renderers";
import { useTranscriptFollowScroll } from "./timeline/scroll-follow";

export type { TranscriptApprovalAnchors } from "./timeline/approval-anchors";
export {
  AgentCommandItem,
  AgentCommandOutputItem,
  AgentContentBlockView,
  AgentDiffItem,
  AgentFileChangeItem,
  AgentMessageItem,
  AgentReasoningItem,
  AgentToolCallItem,
} from "./timeline/item-renderers";

export function AgentMessageList({
  footer,
  approvalAnchors,
  renderItem,
  scrollKey,
  thread,
}: {
  /**
   * Trailing transcript content rendered as the final scroll-area item.
   * The default thread view uses it to keep the pending-approval surface
   * inside the transcript instead of in a separate scroll pane.
   */
  footer?: React.ReactNode;
  approvalAnchors?: TranscriptApprovalAnchors;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  /** Changing this value scrolls the transcript to its end (e.g. a new approval). */
  scrollKey?: string | number;
  thread: ThreadState;
}) {
  const { t } = useAgentI18n();
  const { handleScroll, jumpToLatest, listRef, showJumpLatest } = useTranscriptFollowScroll({
    scrollKey,
    threadId: thread.thread.id,
    turnCount: thread.orderedTurnIds.length,
  });
  const [visibleItemState, setVisibleItemState] = useState({
    limit: DEFAULT_TRANSCRIPT_ITEM_LIMIT,
    threadId: thread.thread.id,
  });
  const visibleItemLimit =
    visibleItemState.threadId === thread.thread.id
      ? visibleItemState.limit
      : DEFAULT_TRANSCRIPT_ITEM_LIMIT;
  const visibleTurnItems = useMemo(
    () => visibleTranscriptWindow(thread, visibleItemLimit),
    [thread, visibleItemLimit],
  );
  const hiddenItemCount = Math.max(0, visibleTurnItems.totalItemCount - visibleTurnItems.visibleItemCount);
  return (
    <div className="aui-message-list-wrap">
      <ol className="aui-message-list" onScroll={handleScroll} ref={listRef}>
        {hiddenItemCount > 0 ? (
          <li className="aui-transcript-pagination">
            <button
              className="aui-btn aui-btn-subtle aui-btn-sm"
              onClick={() =>
                setVisibleItemState({
                  limit: visibleItemLimit + TRANSCRIPT_ITEM_INCREMENT,
                  threadId: thread.thread.id,
                })
              }
              type="button"
            >
              {t("timeline.showEarlier")}
            </button>
            <span>
              {t("timeline.earlierHidden", {
                count: hiddenItemCount,
                label: hiddenItemCount === 1 ? t("timeline.item") : t("timeline.items"),
              })}
            </span>
          </li>
        ) : null}
        {thread.orderedTurnIds.map((turnId) => {
          const turn = thread.turns[turnId];
          const visibleItemIds = visibleTurnItems.itemIdsByTurnId.get(turnId);
          if (!visibleItemIds || visibleItemIds.length === 0) return null;
          return turn ? (
            <AgentTurn
              key={turnId}
              approvals={approvalAnchorsForTurn(turn, approvalAnchors)}
              renderItem={renderItem}
              threadStatus={thread.status}
              turn={turn}
              visibleItemIds={visibleItemIds}
            />
          ) : null;
        })}
        {footer ? <li className="aui-transcript-tail">{footer}</li> : null}
      </ol>
      {showJumpLatest ? (
        <button
          className="aui-btn aui-btn-secondary aui-btn-sm aui-jump-latest"
          onClick={jumpToLatest}
          type="button"
        >
          {t("timeline.jumpToLatest")}
        </button>
      ) : null}
    </div>
  );
}

export const AgentTranscript = AgentMessageList;

export function AgentTurn({
  approvals,
  renderItem,
  threadStatus,
  turn,
  visibleItemIds,
}: {
  approvals?: ApprovalAnchors;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  threadStatus: ThreadState["status"];
  turn: TurnState;
  visibleItemIds?: string[];
}) {
  const { t } = useAgentI18n();
  const timelineItemIds = visibleItemIds ?? transcriptItemIds(turn);
  return (
    <li className="aui-turn">
      {timelineItemIds.flatMap((id) => {
        const item = turn.items[id];
        const block = turn.blocksByItemId?.[id];
        const text = displayText(item?.text ?? turn.streamingTextByItemId[id]);
        if (item && renderItem) {
          const rendered = renderItem(item, turn);
          if (rendered !== undefined) return [<div key={id}>{rendered}</div>, ...anchoredApprovalNodes(approvals?.byItemId[id], approvals)];
        }
        const messageItem = turn.items[id] as AgentItemState | undefined;
        const kind = messageItem?.kind ?? "stream";
        const status = displayItemStatus(
          messageItem?.status ?? "streaming",
          threadStatus,
        );
        if (block && block.kind !== "text") {
          return [
            <article className="aui-message aui-block-message" data-kind={kind} key={id}>
              <div className="aui-message-meta">
                <span>{localizedItemLabel(kind, t)}</span>
                <span>{status}</span>
              </div>
              <AgentContentBlockView
                block={blockForTranscriptItem(turn, id, block)}
                output={turn.commandOutputByItemId[id]}
                patch={turn.filePatchByItemId[id]}
              />
            </article>,
            ...anchoredApprovalNodes(approvals?.byItemId[id], approvals),
          ];
        }
        const synthesizedBlock = blockForTranscriptItem(turn, id, block);
        if (synthesizedBlock.kind !== "text") {
          return [
            <article
              className="aui-message aui-block-message"
              data-kind={synthesizedBlock.kind}
              key={id}
            >
              <div className="aui-message-meta">
                <span>{localizedItemLabel(synthesizedBlock.kind, t)}</span>
                <span>{status}</span>
              </div>
              <AgentContentBlockView
                block={synthesizedBlock}
                output={turn.commandOutputByItemId[id]}
                patch={turn.filePatchByItemId[id]}
              />
            </article>,
            ...anchoredApprovalNodes(approvals?.byItemId[id], approvals),
          ];
        }
        if (!text?.trim()) return anchoredApprovalNodes(approvals?.byItemId[id], approvals);
        return [
          <article className="aui-message" data-kind={kind} key={id}>
            <div className="aui-message-meta">
              <span>{localizedItemLabel(kind, t)}</span>
              <span>{status}</span>
            </div>
            <AgentMessageItem text={text} />
          </article>,
          ...anchoredApprovalNodes(approvals?.byItemId[id], approvals),
        ];
      })}
      {anchoredApprovalNodes(approvals?.afterTurn, approvals)}
    </li>
  );
}

