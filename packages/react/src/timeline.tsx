import type React from "react";
import { useMemo } from "react";
import type {
  AgentTranscriptEntry,
  AgentTranscriptDisplay,
} from "./hooks/transcript";
import type {
  AgentBlockDefaultProps,
  AgentComponents,
  AgentItemDefaultProps,
} from "./components/chat";
import { useAgentTranscriptController } from "./hooks/transcript";
import { useAgentI18n, type AgentI18nKey } from "./i18n";
import {
  anchoredApprovalNodes,
  type ApprovalAnchors,
  type TranscriptApprovalAnchors,
} from "./timeline/approval-anchors";
import {
  AgentContentBlockView,
  AgentMessageItem,
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
  transcriptDisplay,
  resolveLocalMediaUrl,
  scrollKey,
  threadId,
}: {
  /**
   * Trailing transcript content rendered as the final scroll-area item.
   * The default thread view uses it to keep the pending-approval surface
   * inside the transcript instead of in a separate scroll pane.
   */
  footer?: React.ReactNode;
  approvalAnchors?: TranscriptApprovalAnchors;
  components?: AgentComponents;
  renderItem?: (
    entry: AgentTranscriptEntry,
    Default: React.ComponentType<AgentItemDefaultProps>,
  ) => React.ReactNode;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  /** Changing this value scrolls the transcript to its end (e.g. a new approval). */
  scrollKey?: string | number;
  threadId: string;
  transcriptDisplay?: AgentTranscriptDisplay;
}) {
  const { t } = useAgentI18n();
  const anchoredApprovalKey = useMemo(
    () => approvalAnchors?.requests.map((request) => String(request.id)).join("|") ?? "",
    [approvalAnchors?.requests],
  );
  const transcript = useAgentTranscriptController(threadId, {
    approvalAnchors,
    transcriptDisplay,
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
    threadId,
    turnCount: transcript.turnIds.length,
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
        {transcript.turnIds.map((turnId) => {
          const entries = transcript.entriesByTurnId.get(turnId);
          if (!entries || entries.length === 0) return null;
          return (
            <AgentTurn
              key={turnId}
              approvals={
                approvalAnchors
                  ? {
                      afterTurn: [],
                      byItemId: {},
                      renderApprovalAnchor: approvalAnchors.renderApprovalAnchor,
                    }
                  : undefined
              }
              entries={entries}
              components={components}
              renderItem={renderItem}
              resolveLocalMediaUrl={resolveLocalMediaUrl}
            />
          );
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
}: {
  approvals?: ApprovalAnchors;
  components?: AgentComponents;
  entries?: AgentTranscriptEntry[];
  renderItem?: (
    entry: AgentTranscriptEntry,
    Default: React.ComponentType<AgentItemDefaultProps>,
  ) => React.ReactNode;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
}) {
  const { t } = useAgentI18n();
  const transcriptEntries = entries ?? [];
  return (
    <li className="aui-turn">
      {transcriptEntries.flatMap((entry) => {
        const item = entry.item;
        const block = entry.block;
        const defaultItem = (
          <DefaultTranscriptItem
            block={block}
            components={components}
            entry={entry}
            item={item}
            key={entry.key}
            resolveLocalMediaUrl={resolveLocalMediaUrl}
            t={t}
          />
        );
        if (renderItem) {
          function Default() {
            return defaultItem;
          }
          const rendered = renderItem(entry, Default);
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
}: {
  block: AgentTranscriptEntry["block"];
  components?: AgentComponents;
  entry: AgentTranscriptEntry;
  item?: AgentTranscriptEntry["item"];
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  t: (key: AgentI18nKey) => string;
}) {
  const category = entry.category;
  const status = entry.displayStatus;
  const itemAttributes = {
    "data-block-kind": block.kind,
    "data-category": category,
    "data-density": entry.density,
    "data-role": entry.role,
    "data-status": item?.status,
    "data-visibility": entry.visibility,
  };
  if (entry.visibility === "collapsed") {
    return (
      <article
        className={[
          "aui-message",
          block.kind !== "text" ? "aui-block-message" : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
        {...itemAttributes}
      >
        <div className="aui-message-meta">
          <span>{t(entry.displayLabelKey)}</span>
          <span>{status}</span>
        </div>
      </article>
    );
  }
  if (block.kind !== "text") {
    const Block = components?.blocks?.[block.kind];
    const blockView = (
      <AgentContentBlockView
        block={block}
        item={item}
        output={block.output}
        patch={entry.patch}
        resolveLocalMediaUrl={resolveLocalMediaUrl}
      />
    );
    let content = blockView;
    if (Block) {
      function DefaultBlock({ block: defaultBlock, item: defaultItem }: AgentBlockDefaultProps) {
        return (
          <AgentContentBlockView
            block={defaultBlock}
            item={defaultItem}
            output={defaultBlock.output}
            patch={entry.patch}
            resolveLocalMediaUrl={resolveLocalMediaUrl}
          />
        );
      }
      content = <Block Default={DefaultBlock} block={block} item={item} />;
    }
    return (
      <article
        className="aui-message aui-block-message"
        {...itemAttributes}
      >
        <div className="aui-message-meta">
          <span>{t(entry.displayLabelKey)}</span>
          <span>{status}</span>
        </div>
        {content}
      </article>
    );
  }
  if (!entry.text?.trim()) return null;
  const TextBlock = components?.blocks?.text;
  if (TextBlock) {
    function DefaultTextBlock({ block: defaultBlock }: AgentBlockDefaultProps) {
      return <AgentMessageItem text={defaultBlock.text ?? ""} />;
    }
    return (
      <article
        className="aui-message"
        {...itemAttributes}
      >
        <div className="aui-message-meta">
          <span>{t(entry.displayLabelKey)}</span>
          <span>{status}</span>
        </div>
        <TextBlock Default={DefaultTextBlock} block={block} item={item} />
      </article>
    );
  }
  return (
    <article
      className="aui-message"
      {...itemAttributes}
    >
      <div className="aui-message-meta">
        <span>{t(entry.displayLabelKey)}</span>
        <span>{status}</span>
      </div>
      <AgentMessageItem text={entry.text} />
    </article>
  );
}
