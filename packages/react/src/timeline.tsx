import type {
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useMemo } from "react";
import type {
  AgentTranscriptEntry,
  AgentTranscriptDensity,
} from "./hooks/transcript";
import type {
  AgentBlockDefaultProps,
  AgentComponents,
  AgentItemDefaultProps,
} from "./components/chat";
import { useAgentTranscriptControllerForThread } from "./hooks/transcript";
import { useAgentI18n, type AgentI18nKey } from "./i18n";
import {
  anchoredApprovalNodes,
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
  type AgentLocalMediaUrlResolver,
} from "./timeline/item-renderers";
import { useAgentTranscriptScrollController } from "./timeline/scroll-follow";

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
export type { AgentLocalMediaUrlResolver } from "./timeline/item-renderers";

export function AgentMessageList({
  footer,
  approvalAnchors,
  components,
  renderItem,
  density,
  resolveLocalMediaUrl,
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
  components?: AgentComponents;
  density?: AgentTranscriptDensity;
  renderItem?: (
    item: AgentItemState,
    turn: TurnState,
    Default: React.ComponentType<AgentItemDefaultProps>,
  ) => React.ReactNode;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  /** Changing this value scrolls the transcript to its end (e.g. a new approval). */
  scrollKey?: string | number;
  thread: ThreadState;
}) {
  const { t } = useAgentI18n();
  const anchoredApprovalKey = useMemo(
    () => approvalAnchors?.requests.map((request) => String(request.id)).join("|") ?? "",
    [approvalAnchors?.requests],
  );
  const transcript = useAgentTranscriptControllerForThread(thread, {
    approvalAnchors,
    density,
  });
  const {
    handleScroll,
    jumpToLatest,
    jumpToPendingApproval,
    scrollContainerRef,
    showEarlierItems,
    showJumpApproval,
    showJumpLatest,
  } = useAgentTranscriptScrollController({
    hiddenItemCount: transcript.hiddenItemCount,
    onShowEarlierItems: transcript.showEarlierItems,
    pendingApprovalSelector: anchoredApprovalKey
      ? ".aui-transcript-approval-anchor"
      : "[data-aui-no-pending-approval]",
    scrollKey,
    threadId: thread.thread.id,
    turnCount: thread.orderedTurnIds.length,
  });
  return (
    <div className="aui-message-list-wrap">
      <ol
        className="aui-message-list"
        data-density={transcript.density}
        onScroll={handleScroll}
        ref={scrollContainerRef as React.RefObject<HTMLOListElement | null>}
      >
        {transcript.hiddenItemCount > 0 ? (
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
                count: transcript.hiddenItemCount,
                label: transcript.hiddenItemCount === 1 ? t("timeline.item") : t("timeline.items"),
              })}
            </span>
          </li>
        ) : null}
        {thread.orderedTurnIds.map((turnId) => {
          const entries = transcript.entriesByTurnId.get(turnId);
          if (!entries || entries.length === 0) return null;
          const turn = thread.turns[turnId];
          return turn ? (
            <AgentTurn
              key={turnId}
              approvals={
                approvalAnchors
                  ? {
                      afterTurn: afterTurnApprovals(turn, approvalAnchors),
                      byItemId: {},
                      renderApprovalAnchor: approvalAnchors.renderApprovalAnchor,
                    }
                  : undefined
              }
              entries={entries}
              components={components}
              renderItem={renderItem}
              resolveLocalMediaUrl={resolveLocalMediaUrl}
              threadStatus={thread.status}
              turn={turn}
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

export const AgentTranscript = AgentMessageList;

export function AgentTurn({
  approvals,
  components,
  entries,
  renderItem,
  resolveLocalMediaUrl,
  threadStatus,
  turn,
}: {
  approvals?: ApprovalAnchors;
  components?: AgentComponents;
  entries?: AgentTranscriptEntry[];
  renderItem?: (
    item: AgentItemState,
    turn: TurnState,
    Default: React.ComponentType<AgentItemDefaultProps>,
  ) => React.ReactNode;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  threadStatus: ThreadState["status"];
  turn: TurnState;
}) {
  const { t } = useAgentI18n();
  const transcriptEntries =
    entries ??
    turn.itemOrder.map((itemId) => {
      const item = turn.items[itemId];
      const block = blockForTranscriptItem(turn, itemId, turn.blocksByItemId?.[itemId]);
      const status = item?.status ?? "streaming";
      return {
        approvals: [],
        block,
        dataKind: item?.kind ?? block.kind,
        density: "default" as const,
        displayStatus: displayItemStatus(status, threadStatus),
        id: `${turn.turn.id}:${itemId}`,
        item,
        itemId,
        key: itemId,
        role: "system" as const,
        status,
        text: displayText(item?.text ?? turn.streamingTextByItemId[itemId]),
        turnId: turn.turn.id,
      };
    });
  return (
    <li className="aui-turn">
      {transcriptEntries.flatMap((entry) => {
        const item = entry.item;
        const block = entry.block;
        const messageItem = item as AgentItemState | undefined;
        const defaultItem = (
          <DefaultTranscriptItem
            block={block}
            components={components}
            entry={entry}
            item={messageItem}
            key={entry.key}
            resolveLocalMediaUrl={resolveLocalMediaUrl}
            t={t}
            turn={turn}
          />
        );
        if (item && renderItem) {
          function Default() {
            return defaultItem;
          }
          const rendered = renderItem(item, turn, Default);
          if (rendered !== undefined) {
            return [
              <div key={entry.key}>{rendered}</div>,
              ...anchoredApprovalNodes(entry.approvals, approvals),
            ];
          }
        }
        return [defaultItem, ...anchoredApprovalNodes(entry.approvals, approvals)];
      })}
      {anchoredApprovalNodes(approvals?.afterTurn, approvals)}
    </li>
  );
}

function DefaultTranscriptItem({
  block,
  components,
  entry,
  item,
  resolveLocalMediaUrl,
  t,
  turn,
}: {
  block: AgentTranscriptEntry["block"];
  components?: AgentComponents;
  entry: AgentTranscriptEntry;
  item?: AgentItemState;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  t: (key: AgentI18nKey) => string;
  turn: TurnState;
}) {
  const kind = entry.dataKind;
  const status = entry.displayStatus;
  if (block.kind !== "text") {
    const Block = components?.blocks?.[block.kind];
    const blockView = (
      <AgentContentBlockView
        block={block}
        item={item}
        output={turn.commandOutputByItemId[entry.itemId]}
        patch={turn.filePatchByItemId[entry.itemId]}
        resolveLocalMediaUrl={resolveLocalMediaUrl}
      />
    );
    let content = blockView;
    if (Block) {
      function DefaultBlock({ block: defaultBlock, item: defaultItem }: AgentBlockDefaultProps) {
        return (
          <AgentContentBlockView
            block={defaultBlock}
            item={defaultItem as AgentItemState | undefined}
            output={turn.commandOutputByItemId[entry.itemId]}
            patch={turn.filePatchByItemId[entry.itemId]}
            resolveLocalMediaUrl={resolveLocalMediaUrl}
          />
        );
      }
      content = <Block Default={DefaultBlock} block={block} item={item} />;
    }
    return (
      <article
        className="aui-message aui-block-message"
        data-kind={kind}
        data-status={item?.status}
        data-density={entry.density}
      >
        <div className="aui-message-meta">
          <span>{localizedItemLabel(kind, t)}</span>
          <span>{status}</span>
        </div>
        {content}
      </article>
    );
  }
  if (!entry.text?.trim()) return null;
  return (
    <article
      className="aui-message"
      data-kind={kind}
      data-status={item?.status}
      data-density={entry.density}
    >
      <div className="aui-message-meta">
        <span>{localizedItemLabel(kind, t)}</span>
        <span>{status}</span>
      </div>
      <AgentMessageItem text={entry.text} />
    </article>
  );
}

function afterTurnApprovals(
  turn: TurnState,
  anchors: TranscriptApprovalAnchors,
): PendingServerRequest[] {
  return anchors.requests.filter(
    (request) =>
      request.turnId === turn.turn.id &&
      (!request.itemId || !turn.itemOrder.includes(request.itemId)),
  );
}
