import type { AgentTurn, ThreadId, ThreadRegistryState, ThreadRegistryStatus } from "../state";
import { AGENT_RETENTION_POLICY, boundedUniqueAppend } from "../retention";

export interface ThreadIndexStore {
  createInitialState(): ThreadRegistryState;
  classifyStatus(status?: string, turns?: readonly AgentTurn[]): ThreadRegistryStatus;
  upsert(
    registry: ThreadRegistryState,
    threadId: ThreadId,
    status: ThreadRegistryStatus,
    activeThreadId?: ThreadId,
  ): ThreadRegistryState;
}

export const threadIndexStore: ThreadIndexStore = {
  classifyStatus: classifyThreadRegistryStatus,
  createInitialState: createInitialThreadRegistryState,
  upsert: upsertThreadRegistryEntry,
};

export function createInitialThreadRegistryState(): ThreadRegistryState {
  return {
    coldThreadIds: [],
    liveThreadIds: [],
    loadedThreadIds: [],
    previewThreadIds: [],
  };
}

export function classifyThreadRegistryStatus(
  status?: string,
  turns?: readonly AgentTurn[],
): ThreadRegistryStatus {
  if (status === "notLoaded") return turns?.length ? "preview" : "cold";
  if (status === "running" || status === "waitingForInput") return "live";
  return "loaded";
}

export function upsertThreadRegistryEntry(
  registry: ThreadRegistryState,
  threadId: ThreadId,
  status: ThreadRegistryStatus,
  activeThreadId = registry.activeThreadId,
): ThreadRegistryState {
  const remove = (ids: ThreadId[]) => ids.filter((id) => id !== threadId);
  const add = (ids: ThreadId[]) =>
    boundedUniqueAppend(ids, threadId, AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax);
  const next = {
    activeThreadId,
    coldThreadIds: remove(registry.coldThreadIds),
    liveThreadIds: remove(registry.liveThreadIds),
    loadedThreadIds: remove(registry.loadedThreadIds),
    previewThreadIds: remove(registry.previewThreadIds),
  };
  if (status === "cold") next.coldThreadIds = add(next.coldThreadIds);
  if (status === "preview") next.previewThreadIds = add(next.previewThreadIds);
  if (status === "live") next.liveThreadIds = add(next.liveThreadIds);
  if (status === "loaded") next.loadedThreadIds = add(next.loadedThreadIds);
  return next;
}
