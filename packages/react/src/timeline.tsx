import type { AgentItemState, ThreadState, TurnState } from "@nyosegawa/agent-ui-core";
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
        const text = displayText(item?.text ?? turn.streamingTextByItemId[id]);
        const activityKind = activityKindForId(turn, id);
        if (activityKind) return null;
        if (!text?.trim()) return null;
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
  item,
  itemId,
  kind,
  output,
  patch,
}: {
  item?: AgentItemState;
  itemId: string;
  kind: "commandExecution" | "fileChange";
  output?: string;
  patch?: unknown;
}) {
  if (kind === "commandExecution") {
    return <AgentCommandActivity item={item} itemId={itemId} output={output} />;
  }
  if (kind === "fileChange") {
    return <AgentFileChangeActivity item={item} patch={patch} />;
  }
  return null;
}

function AgentCommandActivity({
  item,
  itemId,
  output,
}: {
  item?: AgentItemState;
  itemId: string;
  output?: string;
}) {
  const normalizedOutput = output?.trimEnd() ?? "";
  const title = commandTextForItem(item) ?? displayText(item?.text) ?? itemId;
  const status = item?.status ?? "completed";
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
          {status} · {lineCount(normalizedOutput)} lines
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
  item,
  patch,
}: {
  item?: AgentItemState;
  patch?: unknown;
}) {
  return (
    <details aria-label="Diff preview" className="aui-activity-card aui-file-change-card">
      <summary>
        <span className="aui-terminal-label">diff</span>
        <span className="aui-command-title">
          {displayText(item?.text) ?? "File changes"}
        </span>
        <span className="aui-command-meta">{item?.status ?? "completed"}</span>
      </summary>
      {patch ? (
        <AgentDiffViewer patch={patch} />
      ) : (
        <div className="aui-activity-empty">No patch payload captured.</div>
      )}
    </details>
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
  if (kind === "userMessage") return "You";
  if (kind === "agentMessage") return "Assistant";
  if (kind === "reasoning") return "Reasoning";
  if (kind === "plan") return "Plan";
  return kind;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
