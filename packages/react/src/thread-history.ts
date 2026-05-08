import type {
  AgentEvent,
  AgentItemState,
  AgentThread,
  AgentTurn,
  ThreadId,
  ThreadStatus,
} from "@nyosegawa/agent-ui-core";

export function threadUpsertEvent(rawThread: Record<string, unknown>): AgentEvent {
  return {
    status: normalizeThreadStatus(rawThread.status),
    thread: normalizeRawThread(rawThread),
    type: "thread/upserted",
  };
}

export function threadSnapshotEvents(
  rawThread: Record<string, unknown>,
  activate: boolean,
): AgentEvent[] {
  const thread = normalizeRawThread(rawThread);
  const rawTurns = Array.isArray(rawThread.turns) ? rawThread.turns : [];
  const turns = rawTurns.map((turn) => normalizeRawTurn(turn, thread.id));
  const events: AgentEvent[] = [
    {
      status: normalizeThreadStatus(rawThread.status),
      thread,
      turns,
      type: activate ? "thread/started" : "thread/upserted",
    },
  ];

  for (const rawTurn of rawTurns) {
    const turn = normalizeRawTurn(rawTurn, thread.id);
    const rawTurnRecord = asRecord(rawTurn);
    const items = Array.isArray(rawTurnRecord?.items) ? rawTurnRecord.items : [];
    events.push({
      items: items.map((item) => normalizeRawItem(item, thread.id, turn.id)),
      threadId: thread.id,
      turn,
      type: "turn/completed",
    });
    for (const item of items) {
      const record = asRecord(item);
      if (!record) continue;
      if (record.type === "commandExecution" && typeof record.aggregatedOutput === "string") {
        events.push({
          delta: record.aggregatedOutput,
          itemId: String(record.id),
          threadId: thread.id,
          turnId: turn.id,
          type: "item/commandOutput/delta",
        });
      }
      if (record.type === "fileChange") {
        events.push({
          itemId: String(record.id),
          patch: record.changes ?? record,
          threadId: thread.id,
          turnId: turn.id,
          type: "item/filePatch/updated",
        });
      }
    }
  }

  events.push({
    status: normalizeThreadStatus(rawThread.status),
    threadId: thread.id,
    type: "thread/status/changed",
  });

  return events;
}

function normalizeRawThread(rawThread: Record<string, unknown>): AgentThread {
  return {
    ephemeral: Boolean(rawThread.ephemeral),
    id: String(rawThread.id ?? rawThread.threadId ?? rawThread.thread_id),
    name: stringValue(rawThread.name) ?? stringValue(rawThread.preview),
    path: stringValue(rawThread.path) ?? stringValue(rawThread.cwd),
    raw: rawThread,
  };
}

function normalizeRawTurn(rawTurn: unknown, threadId: ThreadId): AgentTurn {
  const record = asRecord(rawTurn) ?? {};
  return {
    id: String(record.id ?? record.turnId ?? record.turn_id),
    raw: rawTurn,
    status: stringValue(record.status) ?? normalizeThreadStatus(record.status),
    threadId,
  };
}

function normalizeRawItem(rawItem: unknown, threadId: ThreadId, turnId: string): AgentItemState {
  const record = asRecord(rawItem) ?? {};
  const kind = String(record.type ?? record.kind ?? "unknown");
  return {
    id: String(record.id ?? record.itemId ?? record.item_id),
    kind,
    raw: rawItem,
    status: normalizeItemStatus(record.status),
    text: itemText(record),
    threadId,
    turnId,
  };
}

function itemText(record: Record<string, unknown>) {
  if (typeof record.text === "string") return record.text;
  if (Array.isArray(record.summary)) return record.summary.join("\n");
  if (Array.isArray(record.content)) {
    return record.content
      .map((part) => {
        const partRecord = asRecord(part);
        return partRecord ? stringValue(partRecord.text) : undefined;
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof record.command === "string") return record.command;
  if (Array.isArray(record.changes)) return JSON.stringify(record.changes, null, 2);
  return undefined;
}

function normalizeThreadStatus(value: unknown): ThreadStatus {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  if (!record) return "notLoaded";
  const type = stringValue(record.type);
  if (type === "active") return "running";
  if (type === "idle") return "loaded";
  return type ?? "notLoaded";
}

function normalizeItemStatus(value: unknown): AgentItemState["status"] {
  if (value === "completed" || value === "success") return "completed";
  if (value === "failed" || value === "error") return "failed";
  return "inProgress";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}
