import type {
  AgentItemBlock,
  AgentItemBlockKind,
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import { selectThread, type ThreadId } from "@nyosegawa/agent-ui-core";
import { useMemo } from "react";
import { useAgentContext } from "../provider";
import { transcriptItemIds } from "../transcript-window";
import type { TranscriptApprovalAnchors } from "../timeline/approval-anchors";
import { blockForTranscriptItem } from "../timeline/blocks";
import {
  displayItemStatus,
  displayText,
} from "../timeline/formatters";
import { useTranscriptWindowing } from "../timeline/windowing";

export type AgentTranscriptDensityMode = "default" | "compact" | "verbose" | "critical-only";

export interface AgentTranscriptDensityConfig {
  default?: AgentTranscriptDensityMode;
  byBlockKind?: Partial<Record<AgentItemBlockKind, AgentTranscriptDensityMode>>;
}

export type AgentTranscriptDensity =
  | AgentTranscriptDensityMode
  | AgentTranscriptDensityConfig;

export interface AgentTranscriptPendingState {
  status: "failed" | "inProgress";
}

export type AgentTranscriptBlock = Omit<AgentItemBlock, "raw">;
export type AgentTranscriptItem = Omit<AgentItemState, "raw">;

export interface AgentTranscriptEntry {
  approvals: PendingServerRequest[];
  block: AgentTranscriptBlock;
  dataKind: string;
  density: AgentTranscriptDensityMode;
  displayStatus: string;
  id: string;
  item?: AgentTranscriptItem;
  itemId: string;
  key: string;
  pending?: AgentTranscriptPendingState;
  role: "assistant" | "command" | "system" | "tool" | "user";
  status: AgentItemState["status"] | "streaming";
  text?: string;
  turnId: string;
}

export interface AgentTranscriptControllerOptions {
  approvalAnchors?: TranscriptApprovalAnchors;
  density?: AgentTranscriptDensity;
}

export interface AgentTranscriptController {
  density: AgentTranscriptDensityMode;
  entries: AgentTranscriptEntry[];
  entriesByTurnId: Map<string, AgentTranscriptEntry[]>;
  hiddenItemCount: number;
  showEarlierItems(): void;
  visibleItemCount: number;
}

export function useAgentTranscriptController(
  threadId?: ThreadId,
  options: AgentTranscriptControllerOptions = {},
): AgentTranscriptController {
  const { state } = useAgentContext();
  const thread = threadId ? selectThread(state, threadId) : undefined;
  return useAgentTranscriptControllerForThread(thread, options);
}

export function useAgentTranscriptControllerForThread(
  thread: ThreadState | undefined,
  {
    approvalAnchors,
    density = "default",
  }: AgentTranscriptControllerOptions = {},
): AgentTranscriptController {
  const defaultDensity = defaultTranscriptDensity(density);
  const pinnedItemIdsByTurnId = useMemo(
    () => pinnedApprovalItemIdsByTurnId(thread, approvalAnchors?.requests),
    [approvalAnchors?.requests, thread],
  );
  const windowing = useTranscriptWindowing(thread, pinnedItemIdsByTurnId);
  const entriesByTurnId = useMemo(() => {
    if (!thread) return new Map<string, AgentTranscriptEntry[]>();
    const entries = new Map<string, AgentTranscriptEntry[]>();
    for (const turnId of thread.orderedTurnIds) {
      const turn = thread.turns[turnId];
      if (!turn) continue;
      const visibleItemIds = windowing.visibleTurnItems.itemIdsByTurnId.get(turnId);
      if (!visibleItemIds || visibleItemIds.length === 0) continue;
      const afterTurnApprovalVisible =
        afterTurnApprovalsForDensity(turn, approvalAnchors).length > 0;
      const turnEntries = visibleItemIds.map((itemId) =>
        transcriptEntryForItem({
          approvalAnchors,
          density,
          itemId,
          threadStatus: thread.status,
          turn,
        }),
      );
      const filteredTurnEntries = turnEntries.filter((entry, index) =>
        includeTranscriptEntry(entry, {
          preserveForAfterTurnApproval:
            afterTurnApprovalVisible && index === turnEntries.length - 1,
        }),
      );
      if (filteredTurnEntries.length > 0) entries.set(turnId, filteredTurnEntries);
    }
    return entries;
  }, [approvalAnchors, density, thread, windowing.visibleTurnItems.itemIdsByTurnId]);
  const entries = useMemo(
    () => Array.from(entriesByTurnId.values()).flat(),
    [entriesByTurnId],
  );
  return {
    density: defaultDensity,
    entries,
    entriesByTurnId,
    hiddenItemCount: windowing.hiddenItemCount,
    showEarlierItems: windowing.showEarlierItems,
    visibleItemCount: windowing.visibleTurnItems.visibleItemCount,
  };
}

function transcriptEntryForItem({
  approvalAnchors,
  density,
  itemId,
  threadStatus,
  turn,
}: {
  approvalAnchors?: TranscriptApprovalAnchors;
  density: AgentTranscriptDensity;
  itemId: string;
  threadStatus: ThreadState["status"];
  turn: TurnState;
}): AgentTranscriptEntry {
  const item = turn.items[itemId];
  const storedBlock = turn.blocksByItemId?.[itemId];
  const block = stripBlockRaw(blockForTranscriptItem(turn, itemId, storedBlock));
  const text = displayText(item?.text ?? turn.streamingTextByItemId[itemId]);
  const status = item?.status ?? "streaming";
  const dataKind =
    storedBlock && storedBlock.kind !== "text"
      ? item?.kind ?? block.kind
      : block.kind !== "text"
        ? block.kind
        : item?.kind ?? "stream";
  const resolvedDensity = densityForTranscriptBlock(density, block.kind);
  return {
    approvals: approvalAnchorsForEntry(turn, itemId, approvalAnchors),
    block,
    dataKind,
    density: resolvedDensity,
    displayStatus: displayItemStatus(status, threadStatus),
    id: `${turn.turn.id}:${itemId}`,
    item: stripItemRaw(item),
    itemId,
    key: itemId,
    pending:
      status === "failed" || status === "inProgress"
        ? { status }
        : undefined,
    role: transcriptRole(item, block),
    status,
    text,
    turnId: turn.turn.id,
  };
}

function includeTranscriptEntry(
  entry: AgentTranscriptEntry,
  { preserveForAfterTurnApproval = false }: { preserveForAfterTurnApproval?: boolean } = {},
): boolean {
  if (entry.density !== "critical-only") return true;
  if (preserveForAfterTurnApproval) return true;
  return entry.approvals.length > 0 || entry.status === "failed" || entry.status === "inProgress";
}

function defaultTranscriptDensity(density: AgentTranscriptDensity): AgentTranscriptDensityMode {
  return typeof density === "string" ? density : density.default ?? "default";
}

function densityForTranscriptBlock(
  density: AgentTranscriptDensity,
  blockKind: AgentItemBlockKind,
): AgentTranscriptDensityMode {
  if (typeof density === "string") return density;
  return density.byBlockKind?.[blockKind] ?? density.default ?? "default";
}

function stripItemRaw(item: AgentItemState | undefined): AgentTranscriptItem | undefined {
  if (!item) return undefined;
  const viewItem = { ...item };
  delete viewItem.raw;
  return viewItem;
}

function stripBlockRaw(block: AgentItemBlock): AgentTranscriptBlock {
  const viewBlock = { ...block };
  delete viewBlock.raw;
  return viewBlock;
}

function approvalAnchorsForEntry(
  turn: TurnState,
  itemId: string,
  anchors?: TranscriptApprovalAnchors,
): PendingServerRequest[] {
  if (!anchors) return [];
  return anchors.requests.filter((request) => {
    if (request.turnId && request.turnId !== turn.turn.id) return false;
    return request.itemId === itemId;
  });
}

function afterTurnApprovalsForDensity(
  turn: TurnState,
  anchors?: TranscriptApprovalAnchors,
): PendingServerRequest[] {
  if (!anchors) return [];
  return anchors.requests.filter(
    (request) =>
      request.turnId === turn.turn.id &&
      (!request.itemId || !turn.itemOrder.includes(request.itemId)),
  );
}

function transcriptRole(
  item: AgentItemState | undefined,
  block: AgentItemBlock,
): AgentTranscriptEntry["role"] {
  if (item?.kind === "userMessage") return "user";
  if (item?.kind === "agentMessage") return "assistant";
  if (block.kind === "commandExecution" || item?.kind === "commandExecution") return "command";
  if (
    block.kind === "toolCall" ||
    block.kind === "mcpToolCall" ||
    item?.kind === "toolCall" ||
    item?.kind === "mcpToolCall" ||
    item?.kind === "dynamicTool" ||
    item?.kind === "dynamicToolCall"
  ) {
    return "tool";
  }
  return "system";
}

function pinnedApprovalItemIdsByTurnId(
  thread: ThreadState | undefined,
  approvals?: PendingServerRequest[],
): Map<string, string[]> | undefined {
  if (!thread || !approvals?.length) return undefined;
  const pinned = new Map<string, string[]>();
  for (const approval of approvals) {
    const source = pinnedApprovalSource(thread, approval);
    if (!source?.itemId) continue;
    const itemIds = pinned.get(source.turnId) ?? [];
    if (!itemIds.includes(source.itemId)) itemIds.push(source.itemId);
    pinned.set(source.turnId, itemIds);
  }
  return pinned.size > 0 ? pinned : undefined;
}

function pinnedApprovalSource(
  thread: ThreadState,
  approval: PendingServerRequest,
): { itemId?: string; turnId: string } | undefined {
  if (!approval.itemId && !approval.turnId) return undefined;
  const turns = approval.turnId
    ? [thread.turns[approval.turnId]].filter((turn) => turn != null)
    : thread.orderedTurnIds.map((turnId) => thread.turns[turnId]).filter((turn) => turn != null);
  if (turns.length === 0) return undefined;
  if (approval.itemId) {
    const turn = turns.find((candidate) =>
      transcriptItemIds(candidate).includes(approval.itemId!),
    );
    return turn ? { itemId: approval.itemId, turnId: turn.turn.id } : undefined;
  }
  const turn = turns[0];
  if (!turn) return undefined;
  const itemIds = transcriptItemIds(turn);
  return { itemId: itemIds.at(-1), turnId: turn.turn.id };
}
