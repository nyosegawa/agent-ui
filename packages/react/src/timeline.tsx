import type {
  AgentItemBlock,
  AgentItemState,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";
import { useEffect, useRef } from "react";
import { AgentDiffViewer } from "./diff-viewer";
import { MarkdownMessage } from "./markdown";

export function AgentMessageList({
  renderItem,
  thread,
}: {
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  thread: ThreadState;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [thread.thread.id, thread.orderedTurnIds.length]);
  return (
    <ol className="aui-message-list" ref={listRef}>
      {thread.orderedTurnIds.map((turnId) => {
        const turn = thread.turns[turnId];
        return turn ? (
          <AgentTurnView
            key={turnId}
            renderItem={renderItem}
            threadStatus={thread.status}
            turn={turn}
          />
        ) : null;
      })}
    </ol>
  );
}

function AgentTurnView({
  renderItem,
  threadStatus,
  turn,
}: {
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  threadStatus: ThreadState["status"];
  turn: TurnState;
}) {
  const timelineItemIds = turnTimelineItemIds(turn);
  const activityItemIds = timelineItemIds.filter((itemId) =>
    activityKindForId(turn, itemId),
  );
  const hiddenActivityCount = Math.max(
    0,
    activityItemIds.length - MAX_INLINE_ACTIVITY_ITEMS,
  );
  const visibleActivityItemIds = activityItemIds.slice(hiddenActivityCount);
  const hasConversationText = timelineItemIds.some((id) => {
    if (activityKindForId(turn, id)) return false;
    const item = turn.items[id];
    const text = displayText(item?.text ?? turn.streamingTextByItemId[id]);
    return Boolean(text?.trim());
  });
  return (
    <li className="aui-turn">
      {timelineItemIds.map((id) => {
        const item = turn.items[id];
        const block = turn.blocksByItemId?.[id];
        const text = displayText(item?.text ?? turn.streamingTextByItemId[id]);
        const activityKind = activityKindForId(turn, id);
        if (activityKind) return null;
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
                block={block}
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
      {activityItemIds.length > 0 ? (
        <AgentWorkTrace
          activityItemIds={activityItemIds}
          defaultOpen={
            !hasConversationText ||
            threadStatus === "running" ||
            threadStatus === "waitingForInput"
          }
          hiddenActivityCount={hiddenActivityCount}
          itemIds={visibleActivityItemIds}
          turn={turn}
        />
      ) : null}
    </li>
  );
}

const MAX_INLINE_ACTIVITY_ITEMS = 8;

function AgentWorkTrace({
  activityItemIds,
  defaultOpen,
  hiddenActivityCount,
  itemIds,
  turn,
}: {
  activityItemIds: string[];
  defaultOpen: boolean;
  hiddenActivityCount: number;
  itemIds: string[];
  turn: TurnState;
}) {
  const commandCount = activityItemIds.filter(
    (itemId) => activityKindForId(turn, itemId) === "commandExecution",
  ).length;
  const fileChangeCount = activityItemIds.filter(
    (itemId) => activityKindForId(turn, itemId) === "fileChange",
  ).length;
  return (
    <details
      aria-label="Work trace"
      className="aui-work-trace"
      open={defaultOpen ? true : undefined}
    >
      <summary>
        <span>Work trace</span>
        <strong>{activitySummary(commandCount, fileChangeCount)}</strong>
        {hiddenActivityCount > 0 ? (
          <small>{hiddenActivityCount} older steps collapsed</small>
        ) : null}
      </summary>
      <div className="aui-work-trace-list">
        {hiddenActivityCount > 0 ? (
          <ActivityCollapseNotice count={hiddenActivityCount} />
        ) : null}
        {itemIds.map((id) => {
          const item = turn.items[id];
          const activityKind = activityKindForId(turn, id);
          if (!activityKind) return null;
          return (
            <AgentActivityItem
              block={turn.blocksByItemId?.[id]}
              item={item}
              itemId={id}
              key={id}
              kind={activityKind}
              output={turn.commandOutputByItemId[id]}
              patch={turn.filePatchByItemId[id]}
            />
          );
        })}
      </div>
    </details>
  );
}

function activitySummary(commandCount: number, fileChangeCount: number): string {
  const parts = [];
  if (commandCount > 0) parts.push(formatCount(commandCount, "command"));
  if (fileChangeCount > 0) parts.push(formatCount(fileChangeCount, "file change"));
  return parts.length > 0 ? parts.join(", ") : "No captured work";
}

function ActivityCollapseNotice({ count }: { count: number }) {
  return (
    <div className="aui-activity-collapsed">
      {count} older work {count === 1 ? "step" : "steps"} collapsed in this turn
    </div>
  );
}

function AgentActivityItem({
  block,
  item,
  itemId,
  kind,
  output,
  patch,
}: {
  block?: AgentItemBlock;
  item?: AgentItemState;
  itemId: string;
  kind: "commandExecution" | "fileChange";
  output?: string;
  patch?: unknown;
}) {
  if (kind === "commandExecution") {
    return (
      <AgentCommandActivity
        block={block}
        item={item}
        itemId={itemId}
        output={output}
      />
    );
  }
  if (kind === "fileChange") {
    return <AgentFileChangeActivity block={block} item={item} patch={patch} />;
  }
  return null;
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
      return <ThinkingBlock block={block} />;
    case "plan":
      return <PlanBlock block={block} />;
    case "commandExecution":
      return <AgentCommandActivity block={block} output={output ?? block.output} />;
    case "fileChange":
      return <AgentFileChangeActivity block={block} patch={patch} />;
    case "toolCall":
    case "mcpToolCall":
      return <ToolCallBlock block={block} />;
    case "collabToolCall":
      return <CollabToolCallBlock block={block} />;
    case "webSearch":
      return <WebSearchBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "systemInfo":
      return <SystemInfoBlock block={block} />;
    case "text":
      return block.text ? <MessageBody text={block.text} /> : null;
    case "unknown":
    default:
      return <SystemInfoBlock block={{ ...block, kind: "systemInfo" }} />;
  }
}

function AgentCommandActivity({
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
  const normalizedOutput = output?.trimEnd() ?? "";
  const title =
    block?.command ?? commandTextForItem(item) ?? displayText(item?.text) ?? itemId ?? "Command";
  const status = block?.status ?? item?.status ?? "completed";
  const defaultOpen = normalizedOutput.length > 0 && normalizedOutput.length <= 1200;
  return (
    <details
      aria-label="Command output"
      className="aui-activity-card aui-command-card"
      open={defaultOpen ? true : undefined}
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
      {normalizedOutput ? (
        <pre className="aui-command-output">{normalizedOutput}</pre>
      ) : (
        <div className="aui-activity-empty">No terminal output captured.</div>
      )}
    </details>
  );
}

function AgentFileChangeActivity({
  block,
  item,
  patch,
}: {
  block?: AgentItemBlock;
  item?: AgentItemState;
  patch?: unknown;
}) {
  const changes = block?.changes ?? [];
  return (
    <details aria-label="Diff preview" className="aui-activity-card aui-file-change-card">
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
      {changes.length > 0 ? <ChangedFileList changes={changes} /> : null}
      {patch ? (
        <AgentDiffViewer patch={patch} />
      ) : (
        <div className="aui-activity-empty">No patch payload captured.</div>
      )}
    </details>
  );
}

function ThinkingBlock({ block }: { block: AgentItemBlock }) {
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

function ToolCallBlock({ block }: { block: AgentItemBlock }) {
  return (
    <details className="aui-content-block aui-tool-block">
      <summary>
        <span>{block.toolType === "mcp" ? "MCP tool" : "Tool call"}</span>
        <strong>{block.tool ?? "unknown tool"}</strong>
        {block.server ? <small>{block.server}</small> : null}
        {block.status ? <small>{block.status}</small> : null}
        {block.durationMs !== undefined ? <small>{formatDuration(block.durationMs)}</small> : null}
      </summary>
      <JsonSection label="Arguments" value={block.arguments} />
      <JsonSection label="Result" value={block.result} />
      <JsonSection label="Error" value={block.error} tone="danger" />
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

function MessageBody({ text }: { text: string }) {
  const trimmed = text.trim();
  const isLong = trimmed.length > 1800 || trimmed.split(/\r?\n/).length > 18;
  if (!isLong) return <MarkdownMessage className="aui-message-body" text={trimmed} />;
  return (
    <details className="aui-message-body aui-message-body-collapsible">
      <summary>{messagePreview(trimmed)}</summary>
      <MarkdownMessage text={trimmed} />
    </details>
  );
}

function displayText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const text = value.map(displayText).filter(Boolean).join("\n");
    return text || undefined;
  }
  if (isRecord(value)) {
    const record = value;
    if (typeof record.text === "string") return record.text;
    if (typeof record.message === "string") return record.message;
    const json = JSON.stringify(value, null, 2);
    return json === undefined ? undefined : json;
  }
  return String(value);
}

function displayItemStatus(status: string, threadStatus: ThreadState["status"]): string {
  if (status === "inProgress" && isHydratedThreadStatus(threadStatus)) {
    return "completed";
  }
  return status;
}

function isHydratedThreadStatus(status: ThreadState["status"]): boolean {
  return status === "loaded" || status === "complete" || status === "completed";
}

function itemLabel(kind: string): string {
  switch (kind) {
    case "userMessage":
      return "You";
    case "agentMessage":
      return "Assistant";
    case "reasoning":
      return "Reasoning";
    case "plan":
      return "Plan";
    case "commandExecution":
      return "Command";
    case "fileChange":
      return "File change";
    case "toolCall":
    case "mcpToolCall":
      return "Tool";
    case "collabToolCall":
      return "Collab";
    case "webSearch":
      return "Web search";
    case "image":
    case "imageView":
      return "Image";
    case "systemInfo":
      return "System";
    case "contextCompaction":
      return "Compaction";
    case "thinking":
      return "Thinking";
    default:
      return kind
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (letter) => letter.toUpperCase());
  }
}

function commandTextForItem(item: AgentItemState | undefined): string | undefined {
  const raw = item?.raw;
  if (!isRecord(raw)) return undefined;
  const command = raw.command;
  return typeof command === "string" && command.trim() ? command.trim() : undefined;
}

function turnTimelineItemIds(turn: TurnState): string[] {
  const ids = new Set(turn.itemOrder);
  for (const itemId of Object.keys(turn.commandOutputByItemId)) ids.add(itemId);
  for (const itemId of Object.keys(turn.filePatchByItemId)) ids.add(itemId);
  return [...ids];
}

function activityKindForId(
  turn: TurnState,
  itemId: string,
): "commandExecution" | "fileChange" | undefined {
  const kind = turn.items[itemId]?.kind;
  if (kind === "commandExecution" || kind === "fileChange") return kind;
  if (itemId in turn.commandOutputByItemId) return "commandExecution";
  if (itemId in turn.filePatchByItemId) return "fileChange";
  return undefined;
}

function lineCount(value: string): number {
  if (!value) return 0;
  return value.split(/\r?\n/).length;
}

function messagePreview(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? text;
  const preview = firstLine.trim().replace(/\s+/g, " ");
  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

function commandPreview(text: string): string {
  const preview = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!preview) return "";
  return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
}

function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(durationMs < 10_000 ? 1 : 0)}s`;
}

function formatJson(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2) ?? "";
}

function kindLabel(kind: string): string {
  if (kind === "add" || kind === "created") return "+";
  if (kind === "delete" || kind === "deleted") return "-";
  if (kind === "rename" || kind === "renamed") return "R";
  return "M";
}

function shortId(id: string): string {
  return id.length > 12 ? id.slice(0, 12) : id;
}

function isVideoPath(path: string): boolean {
  return /\.(mp4|webm|mov|m4v)$/i.test(path);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
