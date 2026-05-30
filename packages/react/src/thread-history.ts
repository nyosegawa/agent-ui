import type { AgentEvent } from "@nyosegawa/agent-ui-core";
import { normalizeThreadReadResponse } from "@nyosegawa/agent-ui-codex/normalizer";

type ThreadUpsertEvent = Extract<AgentEvent, { type: "thread/upserted" }>;

export function threadUpsertEvent(rawThread: Record<string, unknown>): ThreadUpsertEvent {
  const event = normalizeThreadReadCompatibility(rawThread, false)[0];
  if (event?.type !== "thread/upserted") {
    throw new Error("thread payload is missing an id");
  }
  return event;
}

export function threadSnapshotEvents(
  rawThread: Record<string, unknown>,
  activate: boolean,
): AgentEvent[] {
  return normalizeThreadReadCompatibility(rawThread, activate);
}

export function rawThreadId(rawThread: Record<string, unknown>): string | undefined {
  const value = rawThread.id ?? rawThread.threadId ?? rawThread.thread_id;
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

export function threadProjectPath(
  rawThread: Record<string, unknown>,
): string | undefined {
  const cwd =
    stringValue(rawThread.cwd) ??
    stringValue(rawThread.workingDirectory) ??
    stringValue(rawThread.working_directory);
  if (cwd) return cwd;
  const path = stringValue(rawThread.path);
  return path && !isInternalCodexSessionPath(path) ? path : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function normalizeThreadReadCompatibility(
  rawThread: Record<string, unknown>,
  activate: boolean,
): AgentEvent[] {
  try {
    return normalizeThreadReadResponse({ thread: rawThread }, { activate });
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes("missing a thread id")) {
      throw new Error("thread payload is missing an id", { cause: caught });
    }
    throw caught;
  }
}

function isInternalCodexSessionPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return normalized.includes("/.codex/sessions/") || normalized.endsWith(".jsonl");
}
