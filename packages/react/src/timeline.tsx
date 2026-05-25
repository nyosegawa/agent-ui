import type {
  AgentItemBlock,
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentDiffViewer } from "./diff-viewer";
import { useAgentI18n, type AgentI18nKey } from "./i18n";
import { MarkdownMessage } from "./markdown";
import {
  DEFAULT_TRANSCRIPT_ITEM_LIMIT,
  TRANSCRIPT_ITEM_INCREMENT,
  transcriptItemIds,
  visibleTranscriptWindow,
} from "./transcript-window";
import { blockForTranscriptItem } from "./timeline/blocks";
import {
  commandTextForItem,
  displayItemStatus,
  displayText,
  formatDuration,
  formatJson,
  isRecord,
  isVideoPath,
  itemLabel,
  kindLabel,
  lineCount,
  shortId,
  stringValue,
} from "./timeline/formatters";
import { commandPreview, toolPreview } from "./timeline/previews";

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
              {hiddenItemCount} earlier {hiddenItemCount === 1 ? t("timeline.item") : t("timeline.items")} hidden
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
            <MessageBody text={text} />
          </article>,
          ...anchoredApprovalNodes(approvals?.byItemId[id], approvals),
        ];
      })}
      {anchoredApprovalNodes(approvals?.afterTurn, approvals)}
    </li>
  );
}

interface ApprovalAnchors {
  afterTurn: PendingServerRequest[];
  byItemId: Record<string, PendingServerRequest[]>;
  renderApprovalAnchor: (approval: PendingServerRequest) => React.ReactNode;
}

export interface TranscriptApprovalAnchors {
  requests: PendingServerRequest[];
  renderApprovalAnchor: (approval: PendingServerRequest) => React.ReactNode;
}

function approvalAnchorsForTurn(
  turn: TurnState,
  anchors?: TranscriptApprovalAnchors,
): ApprovalAnchors | undefined {
  if (!anchors) return undefined;
  const byItemId: Record<string, PendingServerRequest[]> = {};
  const afterTurn: PendingServerRequest[] = [];
  for (const request of anchors.requests) {
    if (request.turnId !== turn.turn.id) continue;
    if (request.itemId && turn.itemOrder.includes(request.itemId)) {
      byItemId[request.itemId] = [...(byItemId[request.itemId] ?? []), request];
    } else {
      afterTurn.push(request);
    }
  }
  return { afterTurn, byItemId, renderApprovalAnchor: anchors.renderApprovalAnchor };
}

function anchoredApprovalNodes(
  requests: PendingServerRequest[] | undefined,
  anchors?: ApprovalAnchors,
): React.ReactNode[] {
  return (requests ?? []).map((approval) => (
    <div className="aui-transcript-approval-anchor" key={`approval-${String(approval.id)}`}>
      {anchors?.renderApprovalAnchor(approval)}
    </div>
  ));
}

export function AgentContentBlockView({
  block,
  output,
  patch,
}: {
  block: AgentItemBlock;
  output?: string;
  patch?: unknown;
}) {
  switch (block.kind) {
    case "thinking":
      return <AgentReasoningItem block={block} />;
    case "plan":
      return <PlanBlock block={block} />;
    case "commandExecution":
      return <AgentCommandItem block={block} output={output ?? block.output} />;
    case "fileChange":
      return <AgentFileChangeItem block={block} patch={patch} />;
    case "toolCall":
    case "mcpToolCall":
      return <AgentToolCallItem block={block} />;
    case "collabToolCall":
      return <CollabToolCallBlock block={block} />;
    case "webSearch":
      return <WebSearchBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "systemInfo":
      return <SystemInfoBlock block={block} />;
    case "text":
      return block.text ? <AgentMessageItem text={block.text} /> : null;
    case "unknown":
    default:
      return <SystemInfoBlock block={{ ...block, kind: "systemInfo" }} />;
  }
}

export function AgentCommandItem({
  block,
  item,
  itemId,
  output,
}: {
  block?: AgentItemBlock;
  item?: AgentItemState;
  itemId?: string;
  output?: string;
}) {
  const { t } = useAgentI18n();
  const [isOpen, setOpen] = useState(false);
  const normalizedOutput = output?.trimEnd() ?? "";
  const title =
    block?.command ?? commandTextForItem(item) ?? displayText(item?.text) ?? itemId ?? "Command";
  const status = block?.status ?? item?.status ?? "completed";
  return (
    <details
      aria-label={t("aria.commandOutput")}
      className="aui-transcript-card aui-command-card"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="aui-terminal-label">{t("timeline.terminal")}</span>
        <span className="aui-command-title">{title}</span>
        <span className="aui-command-meta">
          {status}
          {block?.exitCode !== undefined ? ` · exit ${block.exitCode}` : ""}
          {block?.durationMs !== undefined ? ` · ${formatDuration(block.durationMs)}` : ""}
          {" · "}
          {lineCount(normalizedOutput)} {t("timeline.lines")}
        </span>
        {normalizedOutput ? (
          <span className="aui-command-preview">{commandPreview(normalizedOutput)}</span>
        ) : null}
      </summary>
      {isOpen && normalizedOutput ? (
        <pre className="aui-command-output">{normalizedOutput}</pre>
      ) : isOpen ? (
        <div className="aui-transcript-empty">{t("timeline.noTerminalOutput")}</div>
      ) : null}
    </details>
  );
}

export function AgentFileChangeItem({
  block,
  item,
  patch,
}: {
  block?: AgentItemBlock;
  item?: AgentItemState;
  patch?: unknown;
}) {
  const { t } = useAgentI18n();
  const [isOpen, setOpen] = useState(false);
  const changes = block?.changes ?? [];
  return (
    <details
      aria-label={t("aria.diffPreview")}
      className="aui-transcript-card aui-file-change-card"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="aui-terminal-label">{t("timeline.diff")}</span>
        <span className="aui-command-title">
          {displayText(item?.text) ??
            (changes.length > 0
              ? `${changes.length} ${changes.length === 1 ? t("timeline.file") : "files"} changed`
              : t("timeline.fileChanges"))}
        </span>
        <span className="aui-command-meta">{block?.status ?? item?.status ?? "completed"}</span>
      </summary>
      {isOpen && changes.length > 0 ? <ChangedFileList changes={changes} /> : null}
      {isOpen && patch ? (
        <AgentDiffViewer patch={patch} />
      ) : isOpen ? (
        <div className="aui-transcript-empty">{t("timeline.noPatch")}</div>
      ) : null}
    </details>
  );
}

export function AgentReasoningItem({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  const summary = block.summary ?? block.text ?? t("timeline.thinking");
  const content = block.content ?? block.text;
  return (
    <details className="aui-content-block aui-thinking-block">
      <summary>
        <span>{t("timeline.thinking")}</span>
        <small>{summary}</small>
      </summary>
      {content ? <pre>{content}</pre> : null}
    </details>
  );
}

function PlanBlock({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  return (
    <section className="aui-content-block aui-plan-block" aria-label={t("timeline.plan")}>
      <strong>{t("timeline.plan")}</strong>
      <MessageBody text={block.text ?? block.content ?? ""} />
    </section>
  );
}

export function AgentToolCallItem({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  const [isOpen, setOpen] = useState(false);
  const label = block.toolType === "mcp" ? t("timeline.mcpTool") : t("timeline.toolCall");
  const preview = toolPreview(block);
  const title = block.server ? `${block.server} / ${block.tool ?? t("timeline.unknownTool")}` : block.tool ?? t("timeline.unknownTool");
  return (
    <details
      aria-label={label}
      className="aui-content-block aui-tool-block"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>{label}</span>
        <strong>{title}</strong>
        {block.status ? <small>{block.status}</small> : null}
        {block.durationMs !== undefined ? <small>{formatDuration(block.durationMs)}</small> : null}
        {preview ? <em className="aui-tool-preview">{preview}</em> : null}
      </summary>
      {isOpen ? (
        <>
          <JsonSection label={t("timeline.arguments")} value={block.arguments} />
          <JsonSection label={t("timeline.result")} value={block.result} />
          <JsonSection label={t("timeline.error")} value={block.error} tone="danger" />
        </>
      ) : null}
    </details>
  );
}

function CollabToolCallBlock({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  const metadata = isRecord(block.metadata) ? block.metadata : {};
  const senderThreadId = stringValue(metadata.senderThreadId ?? metadata.sender_thread_id);
  const receiverThreadId = stringValue(metadata.receiverThreadId ?? metadata.receiver_thread_id);
  const newThreadId = stringValue(metadata.newThreadId ?? metadata.new_thread_id);
  return (
    <section className="aui-content-block aui-collab-tool-block" aria-label={t("timeline.collabTool")}>
      <div className="aui-content-block-heading">
        <span>{t("timeline.collabTool")}</span>
        <strong>{block.tool ?? t("timeline.agentTool")}</strong>
        {block.status ? <small>{block.status}</small> : null}
      </div>
      {block.text ? <p>{block.text}</p> : null}
      <dl className="aui-block-metadata">
        {senderThreadId ? (
          <>
            <dt>{t("timeline.from")}</dt>
            <dd>{shortId(senderThreadId)}</dd>
          </>
        ) : null}
        {receiverThreadId ? (
          <>
            <dt>{t("timeline.to")}</dt>
            <dd>{shortId(receiverThreadId)}</dd>
          </>
        ) : null}
        {newThreadId ? (
          <>
            <dt>{t("timeline.thread")}</dt>
            <dd>{shortId(newThreadId)}</dd>
          </>
        ) : null}
      </dl>
    </section>
  );
}

function WebSearchBlock({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  return (
    <section className="aui-content-block aui-web-search-block" aria-label={t("timeline.webSearch")}>
      <span>{t("timeline.search")}</span>
      <strong>{block.query ?? block.text ?? t("timeline.webSearch")}</strong>
    </section>
  );
}

function ImageBlock({ block }: { block: AgentItemBlock }) {
  const { t } = useAgentI18n();
  const path = block.path ?? block.text;
  if (!path) {
    return (
      <section className="aui-content-block aui-image-block" aria-label={t("timeline.image")}>
        {t("timeline.imageGenerated")}
      </section>
    );
  }
  const fileName = path.split("/").pop() ?? path;
  return (
    <figure className="aui-content-block aui-image-block">
      {isVideoPath(path) ? (
        // User-provided App Server media path; captions are not available from the protocol.
        <video controls src={path} />
      ) : (
        <img alt={path} src={path} />
      )}
      <figcaption>{fileName}</figcaption>
    </figure>
  );
}

function SystemInfoBlock({ block }: { block: AgentItemBlock }) {
  return (
    <section
      className="aui-content-block aui-system-info-block"
      data-subtype={block.subtype ?? "status"}
    >
      {block.text ?? block.content ?? block.kind}
    </section>
  );
}

function ChangedFileList({ changes }: { changes: unknown[] }) {
  const { t } = useAgentI18n();
  return (
    <ul className="aui-changed-file-list" aria-label={t("aria.changedFiles")}>
      {changes.map((change, index) => {
        const record = isRecord(change) ? change : {};
        const path = stringValue(record.path) ?? "unknown";
        const kind = stringValue(record.kind) ?? "update";
        return (
          <li key={`${path}:${index}`}>
            <span>{kindLabel(kind)}</span>
            <code>{path}</code>
          </li>
        );
      })}
    </ul>
  );
}

function JsonSection({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "danger";
  value: unknown;
}) {
  if (value === undefined || value === null) return null;
  return (
    <div className="aui-json-section" data-tone={tone}>
      <span>{label}</span>
      <pre>{formatJson(value)}</pre>
    </div>
  );
}

export function AgentMessageItem({ text }: { text: string }) {
  const trimmed = text.trim();
  return <MarkdownMessage className="aui-message-body" text={trimmed} />;
}

export const AgentCommandOutputItem = AgentCommandItem;
export const AgentDiffItem = AgentFileChangeItem;

function MessageBody({ text }: { text: string }) {
  return <AgentMessageItem text={text} />;
}

function localizedItemLabel(
  kind: string,
  t: (key: AgentI18nKey) => string,
): string {
  switch (kind) {
    case "userMessage":
      return t("timeline.you");
    case "agentMessage":
      return t("timeline.assistant");
    case "reasoning":
      return t("timeline.reasoning");
    case "plan":
      return t("timeline.plan");
    case "commandExecution":
      return t("timeline.command");
    case "fileChange":
      return t("timeline.fileChange");
    case "toolCall":
    case "mcpToolCall":
      return t("timeline.tool");
    case "collabToolCall":
      return t("timeline.collab");
    case "webSearch":
      return t("timeline.webSearch");
    case "image":
    case "imageView":
      return t("timeline.image");
    case "systemInfo":
      return t("timeline.system");
    case "contextCompaction":
      return t("timeline.compaction");
    case "thinking":
      return t("timeline.thinking");
    default:
      return itemLabel(kind);
  }
}
