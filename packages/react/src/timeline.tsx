import type {
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAgentI18n } from "./i18n";
import { transcriptItemIds } from "./transcript-window";
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
import { useTranscriptWindowing } from "./timeline/windowing";

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
  const [showJumpApproval, setShowJumpApproval] = useState(false);
  const pinnedItemIdsByTurnId = pinnedApprovalItemIdsByTurnId(
    thread,
    approvalAnchors?.requests,
  );
  const anchoredApprovalKey = useMemo(
    () => approvalAnchors?.requests.map((request) => String(request.id)).join("|") ?? "",
    [approvalAnchors?.requests],
  );
  const updateJumpApproval = useCallback(() => {
    const list = listRef.current;
    const anchor = list?.querySelector<HTMLElement>(".aui-transcript-approval-anchor");
    if (!list || !anchor) {
      setShowJumpApproval(false);
      return;
    }
    setShowJumpApproval(!isElementFullyVisibleInScrollContainer(list, anchor));
  }, [listRef]);
  const jumpToPendingApproval = useCallback(() => {
    const anchor = listRef.current?.querySelector<HTMLElement>(
      ".aui-transcript-approval-anchor",
    );
    anchor?.scrollIntoView({ block: "center", behavior: "smooth" });
    setShowJumpApproval(false);
  }, [listRef]);
  const handleTranscriptScroll = useCallback(() => {
    handleScroll();
    updateJumpApproval();
  }, [handleScroll, updateJumpApproval]);
  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      if (!anchoredApprovalKey) {
        setShowJumpApproval(false);
        return;
      }
      updateJumpApproval();
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [anchoredApprovalKey, updateJumpApproval]);
  const { hiddenItemCount, showEarlierItems, visibleTurnItems } =
    useTranscriptWindowing(thread, pinnedItemIdsByTurnId);
  return (
    <div className="aui-message-list-wrap">
      <ol className="aui-message-list" onScroll={handleTranscriptScroll} ref={listRef}>
        {hiddenItemCount > 0 ? (
          <li className="aui-transcript-pagination">
            <button
              className="aui-btn aui-btn-subtle aui-btn-sm"
              onClick={showEarlierItems}
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
      {showJumpApproval ? (
        <button
          className="aui-btn aui-btn-secondary aui-btn-sm aui-jump-approval"
          onClick={jumpToPendingApproval}
          type="button"
        >
          {t("timeline.jumpToPendingApproval")}
        </button>
      ) : null}
    </div>
  );
}

function isElementFullyVisibleInScrollContainer(
  container: HTMLElement,
  element: HTMLElement,
): boolean {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  return elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom;
}

function pinnedApprovalItemIdsByTurnId(
  thread: ThreadState,
  approvals?: PendingServerRequest[],
): Map<string, string[]> | undefined {
  if (!approvals?.length) return undefined;
  const pinned = new Map<string, string[]>();
  for (const approval of approvals) {
    const source = pinnedApprovalSource(thread, approval);
    if (!source?.itemId) continue;
    const itemIds = pinned.get(source.turnId) ?? [];
    if (!itemIds.includes(source.itemId)) itemIds.push(source.itemId);
    pinned.set(source.turnId, itemIds);
  }
  return pinned.size > 0 ? pinned : undefined;
}

function pinnedApprovalSource(
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
  return { itemId: itemIds.at(-1), turnId: turn.turn.id };
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

