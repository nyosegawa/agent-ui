import type { AgentItemState, ThreadState, TurnState } from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const listRef = useRef<HTMLOListElement | null>(null);
  const followModeRef = useRef(true);
  const rafRef = useRef<number | undefined>(undefined);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
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
  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const list = listRef.current;
    if (!list) return false;
    if (typeof list.scrollTo === "function") {
      list.scrollTo({ behavior, top: list.scrollHeight });
    } else {
      list.scrollTop = list.scrollHeight;
    }
    // Metadata-free approvals live at the transcript tail. When one is taller
    // than the viewport, scrolling to the very bottom would clip the primary
    // decision footer above the fold; pull back just enough so the actions
    // stay visible without a manual scroll.
    const actions = list.querySelector<HTMLElement>(
      ".aui-transcript-tail .aui-approval-actions",
    );
    if (actions) {
      const clippedAbove =
        list.getBoundingClientRect().top - actions.getBoundingClientRect().top;
      if (clippedAbove > 0) list.scrollTop -= clippedAbove + 12;
    }
    return true;
  }, []);
  const scheduleFollowScroll = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!followModeRef.current) {
      setShowJumpLatest(true);
      return;
    }
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined;
      scrollToLatest(behavior);
      setShowJumpLatest(false);
    });
  }, [scrollToLatest]);
  useEffect(() => {
    scheduleFollowScroll("auto");
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleFollowScroll, thread.thread.id, thread.orderedTurnIds.length, scrollKey]);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new MutationObserver(() => scheduleFollowScroll("smooth"));
    observer.observe(list, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [scheduleFollowScroll, thread.thread.id]);
  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    const shouldFollow = distanceFromBottom <= 80;
    followModeRef.current = shouldFollow;
    if (shouldFollow) setShowJumpLatest(false);
  };
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
          onClick={() => {
            followModeRef.current = true;
            setShowJumpLatest(false);
            scrollToLatest("smooth");
          }}
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

