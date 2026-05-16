import type {
  AgentItemBlock,
  AgentItemState,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentDiffViewer } from "./diff-viewer";
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
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  /** Changing this value scrolls the transcript to its end (e.g. a new approval). */
  scrollKey?: string | number;
  thread: ThreadState;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
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
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
    // The pending-approval surface lives at the end of the transcript. When
    // it is taller than the viewport, scrolling to the very bottom would clip
    // the primary decision footer above the fold — pull back just enough so
    // the Approve / Decline actions stay visible without a manual scroll.
    const actions = list.querySelector<HTMLElement>(
      ".aui-transcript-tail .aui-approval-actions",
    );
    if (actions) {
      const clippedAbove =
        list.getBoundingClientRect().top - actions.getBoundingClientRect().top;
      if (clippedAbove > 0) list.scrollTop -= clippedAbove + 12;
    }
  }, [thread.thread.id, thread.orderedTurnIds.length, scrollKey]);
  return (
    <ol className="aui-message-list" ref={listRef}>
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
            Show earlier items
          </button>
          <span>
            {hiddenItemCount} earlier {hiddenItemCount === 1 ? "item" : "items"} hidden
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
            renderItem={renderItem}
            threadStatus={thread.status}
            turn={turn}
            visibleItemIds={visibleItemIds}
          />
        ) : null;
      })}
      {footer ? <li className="aui-transcript-tail">{footer}</li> : null}
    </ol>
  );
}

export const AgentTranscript = AgentMessageList;

export function AgentTurn({
  renderItem,
  threadStatus,
  turn,
  visibleItemIds,
}: {
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  threadStatus: ThreadState["status"];
  turn: TurnState;
  visibleItemIds?: string[];
}) {
  const timelineItemIds = visibleItemIds ?? transcriptItemIds(turn);
  return (
    <li className="aui-turn">
      {timelineItemIds.map((id) => {
        const item = turn.items[id];
        const block = turn.blocksByItemId?.[id];
        const text = displayText(item?.text ?? turn.streamingTextByItemId[id]);
        if (item && renderItem) {
          const rendered = renderItem(item, turn);
          if (rendered !== undefined) return <div key={id}>{rendered}</div>;
        }
        const messageItem = turn.items[id] as AgentItemState | undefined;
        const kind = messageItem?.kind ?? "stream";
        const status = displayItemStatus(
          messageItem?.status ?? "streaming",
          threadStatus,
        );
        if (block && block.kind !== "text") {
          return (
            <article className="aui-message aui-block-message" data-kind={kind} key={id}>
              <div className="aui-message-meta">
                <span>{itemLabel(kind)}</span>
                <span>{status}</span>
              </div>
              <AgentContentBlockView
                block={blockForTranscriptItem(turn, id, block)}
                output={turn.commandOutputByItemId[id]}
                patch={turn.filePatchByItemId[id]}
              />
            </article>
          );
        }
        const synthesizedBlock = blockForTranscriptItem(turn, id, block);
        if (synthesizedBlock.kind !== "text") {
          return (
            <article
              className="aui-message aui-block-message"
              data-kind={synthesizedBlock.kind}
              key={id}
            >
              <div className="aui-message-meta">
                <span>{itemLabel(synthesizedBlock.kind)}</span>
                <span>{status}</span>
              </div>
              <AgentContentBlockView
                block={synthesizedBlock}
                output={turn.commandOutputByItemId[id]}
                patch={turn.filePatchByItemId[id]}
              />
            </article>
          );
        }
        if (!text?.trim()) return null;
        return (
          <article className="aui-message" data-kind={kind} key={id}>
            <div className="aui-message-meta">
              <span>{itemLabel(kind)}</span>
              <span>{status}</span>
            </div>
            <MessageBody text={text} />
          </article>
        );
      })}
    </li>
  );
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
  const [isOpen, setOpen] = useState(false);
  const normalizedOutput = output?.trimEnd() ?? "";
  const title =
    block?.command ?? commandTextForItem(item) ?? displayText(item?.text) ?? itemId ?? "Command";
  const status = block?.status ?? item?.status ?? "completed";
  return (
    <details
      aria-label="Command output"
      className="aui-transcript-card aui-command-card"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="aui-terminal-label">terminal</span>
        <span className="aui-command-title">{title}</span>
        <span className="aui-command-meta">
          {status}
          {block?.exitCode !== undefined ? ` · exit ${block.exitCode}` : ""}
          {block?.durationMs !== undefined ? ` · ${formatDuration(block.durationMs)}` : ""}
          {" · "}
          {lineCount(normalizedOutput)} lines
        </span>
        {normalizedOutput ? (
          <span className="aui-command-preview">{commandPreview(normalizedOutput)}</span>
        ) : null}
      </summary>
      {isOpen && normalizedOutput ? (
        <pre className="aui-command-output">{normalizedOutput}</pre>
      ) : isOpen ? (
        <div className="aui-transcript-empty">No terminal output captured.</div>
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
  const [isOpen, setOpen] = useState(false);
  const changes = block?.changes ?? [];
  return (
    <details
      aria-label="Diff preview"
      className="aui-transcript-card aui-file-change-card"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="aui-terminal-label">diff</span>
        <span className="aui-command-title">
          {displayText(item?.text) ??
            (changes.length > 0
              ? `${changes.length} ${changes.length === 1 ? "file" : "files"} changed`
              : "File changes")}
        </span>
        <span className="aui-command-meta">{block?.status ?? item?.status ?? "completed"}</span>
      </summary>
      {isOpen && changes.length > 0 ? <ChangedFileList changes={changes} /> : null}
      {isOpen && patch ? (
        <AgentDiffViewer patch={patch} />
      ) : isOpen ? (
        <div className="aui-transcript-empty">No patch payload captured.</div>
      ) : null}
    </details>
  );
}

export function AgentReasoningItem({ block }: { block: AgentItemBlock }) {
  const summary = block.summary ?? block.text ?? "Thinking";
  const content = block.content ?? block.text;
  return (
    <details className="aui-content-block aui-thinking-block">
      <summary>
        <span>Thinking</span>
        <small>{summary}</small>
      </summary>
      {content ? <pre>{content}</pre> : null}
    </details>
  );
}

function PlanBlock({ block }: { block: AgentItemBlock }) {
  return (
    <section className="aui-content-block aui-plan-block" aria-label="Plan">
      <strong>Plan</strong>
      <MessageBody text={block.text ?? block.content ?? ""} />
    </section>
  );
}

export function AgentToolCallItem({ block }: { block: AgentItemBlock }) {
  const [isOpen, setOpen] = useState(false);
  const label = block.toolType === "mcp" ? "MCP tool" : "Tool call";
  const preview = toolPreview(block);
  const title = block.server ? `${block.server} / ${block.tool ?? "unknown tool"}` : block.tool ?? "unknown tool";
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
          <JsonSection label="Arguments" value={block.arguments} />
          <JsonSection label="Result" value={block.result} />
          <JsonSection label="Error" value={block.error} tone="danger" />
        </>
      ) : null}
    </details>
  );
}

function CollabToolCallBlock({ block }: { block: AgentItemBlock }) {
  const metadata = isRecord(block.metadata) ? block.metadata : {};
  const senderThreadId = stringValue(metadata.senderThreadId ?? metadata.sender_thread_id);
  const receiverThreadId = stringValue(metadata.receiverThreadId ?? metadata.receiver_thread_id);
  const newThreadId = stringValue(metadata.newThreadId ?? metadata.new_thread_id);
  return (
    <section className="aui-content-block aui-collab-tool-block" aria-label="Collab tool call">
      <div className="aui-content-block-heading">
        <span>Collab tool</span>
        <strong>{block.tool ?? "agent tool"}</strong>
        {block.status ? <small>{block.status}</small> : null}
      </div>
      {block.text ? <p>{block.text}</p> : null}
      <dl className="aui-block-metadata">
        {senderThreadId ? (
          <>
            <dt>From</dt>
            <dd>{shortId(senderThreadId)}</dd>
          </>
        ) : null}
        {receiverThreadId ? (
          <>
            <dt>To</dt>
            <dd>{shortId(receiverThreadId)}</dd>
          </>
        ) : null}
        {newThreadId ? (
          <>
            <dt>Thread</dt>
            <dd>{shortId(newThreadId)}</dd>
          </>
        ) : null}
      </dl>
    </section>
  );
}

function WebSearchBlock({ block }: { block: AgentItemBlock }) {
  return (
    <section className="aui-content-block aui-web-search-block" aria-label="Web search">
      <span>Search</span>
      <strong>{block.query ?? block.text ?? "web search"}</strong>
    </section>
  );
}

function ImageBlock({ block }: { block: AgentItemBlock }) {
  const path = block.path ?? block.text;
  if (!path) {
    return (
      <section className="aui-content-block aui-image-block" aria-label="Image">
        Image generated
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
  return (
    <ul className="aui-changed-file-list" aria-label="Changed files">
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
