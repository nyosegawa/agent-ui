import type {
  AgentItemBlock,
  AgentItemState,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core/internal";
import { selectThread } from "@nyosegawa/agent-ui-core/internal";
import type { AgentTranscriptBlockView, ThreadId } from "@nyosegawa/agent-ui-core";
import { useMemo } from "react";
import type { AgentI18nKey } from "../i18n";
import { useInternalAgentContext } from "../provider";
import type { AgentApprovalRequest } from "../approval-types";
import { transcriptItemIds } from "../transcript-window";
import type { TranscriptApprovalAnchors } from "../timeline/approval-anchors";
import { blockForTranscriptItem } from "../timeline/blocks";
import {
  displayItemStatus,
  displayText,
  isRecord,
  stringValue,
} from "../timeline/formatters";
import { useTranscriptWindowing } from "../timeline/windowing";

export type AgentTranscriptCategory =
  | "message"
  | "reasoning"
  | "plan"
  | "command"
  | "fileChange"
  | "toolActivity"
  | "web"
  | "media"
  | "system"
  | "unknown";

export type AgentTranscriptDisplayDensity = "comfortable" | "compact" | "expanded";

export type AgentTranscriptDisplayVisibility = "visible" | "collapsed" | "hidden";

export interface AgentTranscriptDisplayRule {
  density?: AgentTranscriptDisplayDensity;
  visibility?: AgentTranscriptDisplayVisibility;
}

/**
 * Public transcript display policy. Resolution order is default -> byCategory -> byRole.
 * Safety overrides are applied after policy resolution, so failed, in-progress,
 * and approval-anchored entries remain fully visible.
 */
export interface AgentTranscriptDisplayPolicy {
  byCategory?: Partial<Record<AgentTranscriptCategory, AgentTranscriptDisplayRule>>;
  byRole?: Partial<Record<AgentTranscriptEntry["role"], AgentTranscriptDisplayRule>>;
  default?: AgentTranscriptDisplayRule;
}

export type AgentTranscriptDisplayPreset = "answer-focused";

export type AgentTranscriptDisplay =
  | AgentTranscriptDisplayPreset
  | AgentTranscriptDisplayPolicy;

export interface AgentTranscriptPendingState {
  status: "failed" | "inProgress";
}

export type AgentTranscriptBlock = AgentTranscriptBlockView;

export type AgentTranscriptItemStatus =
  | "cancelled"
  | "completed"
  | "failed"
  | "inProgress"
  | "pending"
  | "streaming";

export interface AgentTranscriptItem {
  id: string;
  kind: string;
  status?: AgentTranscriptItemStatus;
  text?: string;
  threadId?: string;
  turnId?: string;
}

export interface AgentTranscriptEntry {
  approvals: AgentApprovalRequest[];
  block: AgentTranscriptBlock;
  category: AgentTranscriptCategory;
  density: AgentTranscriptDisplayDensity;
  displayLabelKey: AgentI18nKey;
  displayStatus: string;
  id: string;
  item?: AgentTranscriptItem;
  itemId: string;
  key: string;
  pending?: AgentTranscriptPendingState;
  patch?: unknown;
  role: "assistant" | "command" | "system" | "tool" | "user";
  status: AgentTranscriptItemStatus;
  text?: string;
  turnId: string;
  visibility: AgentTranscriptDisplayVisibility;
}

export interface AgentTranscriptControllerOptions {
  approvalAnchors?: TranscriptApprovalAnchors;
  transcriptDisplay?: AgentTranscriptDisplay;
}

export interface AgentTranscriptController {
  density: AgentTranscriptDisplayDensity;
  entries: AgentTranscriptEntry[];
  entriesByTurnId: Map<string, AgentTranscriptEntry[]>;
  hiddenItemCount: number;
  showEarlierItems(): void;
  threadId?: string;
  turnIds: string[];
  visibleItemCount: number;
}

export function useAgentTranscriptController(
  threadId?: ThreadId,
  options: AgentTranscriptControllerOptions = {},
): AgentTranscriptController {
  const { state } = useInternalAgentContext();
  const thread = threadId ? selectThread(state, threadId) : undefined;
  return useAgentTranscriptControllerForThread(thread, options);
}

function useAgentTranscriptControllerForThread(
  thread: ThreadState | undefined,
  {
    approvalAnchors,
    transcriptDisplay,
  }: AgentTranscriptControllerOptions = {},
): AgentTranscriptController {
  const displayPolicy = useMemo(
    () => normalizeTranscriptDisplay(transcriptDisplay),
    [transcriptDisplay],
  );
  const defaultRule = resolvedDefaultTranscriptRule(displayPolicy);
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
        afterTurnApprovalsForDisplay(turn, approvalAnchors).length > 0;
      const turnEntries = visibleItemIds.map((itemId) =>
        transcriptEntryForItem({
          approvalAnchors,
          itemId,
          transcriptDisplay: displayPolicy,
          threadStatus: thread.status,
          turn,
        }),
      );
      const filteredTurnEntries = turnEntries
        .map((entry, index) =>
          afterTurnApprovalVisible && index === turnEntries.length - 1
            ? { ...entry, visibility: "visible" as const }
            : entry,
        )
        .filter((entry) => includeTranscriptEntry(entry));
      if (filteredTurnEntries.length > 0) entries.set(turnId, filteredTurnEntries);
    }
    return entries;
  }, [approvalAnchors, displayPolicy, thread, windowing.visibleTurnItems.itemIdsByTurnId]);
  const entries = useMemo(
    () => Array.from(entriesByTurnId.values()).flat(),
    [entriesByTurnId],
  );
  return {
    density: defaultRule.density,
    entries,
    entriesByTurnId,
    hiddenItemCount: windowing.hiddenItemCount,
    showEarlierItems: windowing.showEarlierItems,
    threadId: thread?.thread.id,
    turnIds: thread?.orderedTurnIds ?? [],
    visibleItemCount: windowing.visibleTurnItems.visibleItemCount,
  };
}

function transcriptEntryForItem({
  approvalAnchors,
  itemId,
  transcriptDisplay,
  threadStatus,
  turn,
}: {
  approvalAnchors?: TranscriptApprovalAnchors;
  itemId: string;
  transcriptDisplay: AgentTranscriptDisplayPolicy;
  threadStatus: ThreadState["status"];
  turn: TurnState;
}): AgentTranscriptEntry {
  const item = turn.items[itemId];
  const storedBlock = turn.blocksByItemId?.[itemId];
  const block = stripBlockRaw(blockForTranscriptItem(turn, itemId, storedBlock), {
    output: turn.commandOutputByItemId[itemId],
  });
  const text = displayText(item?.text ?? turn.streamingTextByItemId[itemId]);
  const status = item?.status ?? "streaming";
  const role = transcriptRole(item, block);
  const category = transcriptCategory(item, block, role);
  const approvals = approvalAnchorsForEntry(turn, itemId, approvalAnchors);
  const rule = resolvedTranscriptRule(transcriptDisplay, {
    approvals,
    category,
    role,
    status,
  });
  return {
    approvals,
    block,
    category,
    density: rule.density,
    displayLabelKey: transcriptLabelKey(item, block, role),
    displayStatus: displayItemStatus(status, threadStatus),
    id: `${turn.turn.id}:${itemId}`,
    item: stripItemRaw(item),
    itemId,
    key: itemId,
    patch: turn.filePatchByItemId[itemId],
    pending:
      status === "failed" || status === "inProgress"
        ? { status }
        : undefined,
    role,
    status,
    text,
    turnId: turn.turn.id,
    visibility: rule.visibility,
  };
}

function includeTranscriptEntry(
  entry: AgentTranscriptEntry,
): boolean {
  if (entry.visibility !== "hidden") return true;
  return entry.approvals.length > 0 || entry.status === "failed" || entry.status === "inProgress";
}

function normalizeTranscriptDisplay(
  transcriptDisplay: AgentTranscriptDisplay | undefined,
): AgentTranscriptDisplayPolicy {
  if (transcriptDisplay === "answer-focused") {
    return {
      byCategory: {
        command: { visibility: "collapsed" },
        fileChange: { visibility: "collapsed" },
        plan: { visibility: "collapsed" },
        reasoning: { visibility: "hidden" },
        system: { visibility: "collapsed" },
        toolActivity: { visibility: "collapsed" },
        web: { visibility: "collapsed" },
      },
      default: { density: "comfortable", visibility: "visible" },
    };
  }
  return transcriptDisplay ?? {};
}

function resolvedDefaultTranscriptRule(
  policy: AgentTranscriptDisplayPolicy,
): Required<AgentTranscriptDisplayRule> {
  return {
    density: policy.default?.density ?? "comfortable",
    visibility: policy.default?.visibility ?? "visible",
  };
}

function resolvedTranscriptRule(
  policy: AgentTranscriptDisplayPolicy,
  {
    approvals,
    category,
    role,
    status,
  }: {
    approvals: AgentApprovalRequest[];
    category: AgentTranscriptCategory;
    role: AgentTranscriptEntry["role"];
    status: AgentTranscriptItemStatus;
  },
): Required<AgentTranscriptDisplayRule> {
  const merged = {
    ...resolvedDefaultTranscriptRule(policy),
    ...policy.byCategory?.[category],
    ...policy.byRole?.[role],
  };
  if (approvals.length > 0 || status === "failed" || status === "inProgress") {
    return { ...merged, visibility: "visible" };
  }
  return merged;
}

function stripItemRaw(item: AgentItemState | undefined): AgentTranscriptItem | undefined {
  if (!item) return undefined;
  return {
    id: item.id,
    kind: item.kind,
    status: item.status,
    text: item.text,
    threadId: item.threadId,
    turnId: item.turnId,
  };
}

function stripBlockRaw(
  block: AgentItemBlock,
  overlays: { output?: string } = {},
): AgentTranscriptBlock {
  const collabMetadata = isRecord(block.metadata) ? block.metadata : {};
  return {
    ...(block.arguments !== undefined ? { argumentsText: displayValue(block.arguments) } : {}),
    ...(block.changes !== undefined ? { files: changedFileViews(block.changes) } : {}),
    ...(block.command !== undefined ? { command: block.command } : {}),
    ...(block.content !== undefined ? { content: block.content } : {}),
    ...(block.cwd !== undefined ? { cwd: block.cwd } : {}),
    ...(block.durationMs !== undefined ? { durationMs: block.durationMs } : {}),
    ...(block.error !== undefined ? { errorText: displayValue(block.error) } : {}),
    ...(block.exitCode !== undefined ? { exitCode: block.exitCode } : {}),
    id: block.id,
    kind: block.kind,
    ...(stringValue(collabMetadata.newThreadId ?? collabMetadata.new_thread_id)
      ? {
          newThreadId: stringValue(collabMetadata.newThreadId ?? collabMetadata.new_thread_id),
        }
      : {}),
    ...(overlays.output !== undefined || block.output !== undefined
      ? { output: overlays.output ?? block.output }
      : {}),
    ...(block.path !== undefined ? { path: block.path } : {}),
    ...(block.query !== undefined ? { query: block.query } : {}),
    ...(stringValue(collabMetadata.receiverThreadId ?? collabMetadata.receiver_thread_id)
      ? {
          receiverThreadId: stringValue(
            collabMetadata.receiverThreadId ?? collabMetadata.receiver_thread_id,
          ),
        }
      : {}),
    ...(block.resource !== undefined ? { resource: block.resource } : {}),
    ...(block.result !== undefined ? { resultText: resultDisplayValue(block.result) } : {}),
    ...(block.server !== undefined ? { server: block.server } : {}),
    ...(stringValue(collabMetadata.senderThreadId ?? collabMetadata.sender_thread_id)
      ? {
          senderThreadId: stringValue(
            collabMetadata.senderThreadId ?? collabMetadata.sender_thread_id,
          ),
        }
      : {}),
    ...(block.status !== undefined ? { status: block.status } : {}),
    ...(block.subtype !== undefined ? { subtype: block.subtype } : {}),
    ...(block.summary !== undefined ? { summary: block.summary } : {}),
    ...(block.text !== undefined ? { text: block.text } : {}),
    ...(block.tool !== undefined ? { tool: block.tool } : {}),
    ...(block.toolType !== undefined ? { toolType: block.toolType } : {}),
  };
}

function changedFileViews(changes: readonly unknown[]) {
  return changes.map((change) => {
    const record = isRecord(change) ? change : {};
    return {
      kind: stringValue(record.kind) ?? "update",
      path: stringValue(record.path) ?? "unknown",
    };
  });
}

function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function resultDisplayValue(value: unknown): string {
  const record = isRecord(value) ? value : undefined;
  const content = Array.isArray(record?.content) ? record.content : undefined;
  const textItem = content?.find(
    (item) => isRecord(item) && item.type === "text" && typeof item.text === "string",
  );
  return isRecord(textItem) && typeof textItem.text === "string"
    ? textItem.text
    : displayValue(value);
}

function approvalAnchorsForEntry(
  turn: TurnState,
  itemId: string,
  anchors?: TranscriptApprovalAnchors,
): AgentApprovalRequest[] {
  if (!anchors) return [];
  const isLastTurnItem = turn.itemOrder.at(-1) === itemId;
  return anchors.requests.filter((request) => {
    if (request.itemId) return request.itemId === itemId;
    if (request.turnId && request.turnId !== turn.turn.id) return false;
    return isLastTurnItem;
  });
}

function afterTurnApprovalsForDisplay(
  turn: TurnState,
  anchors?: TranscriptApprovalAnchors,
): AgentApprovalRequest[] {
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
  if (item?.kind === "agentMessage" || item?.kind === "assistantMessage") return "assistant";
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

function transcriptCategory(
  item: AgentItemState | undefined,
  block: AgentItemBlock,
  role: AgentTranscriptEntry["role"],
): AgentTranscriptCategory {
  if (block.kind === "text" && (role === "user" || role === "assistant")) return "message";
  if (block.kind === "unknown") return "unknown";
  if (block.kind === "thinking" || item?.kind === "reasoning") return "reasoning";
  if (block.kind === "plan" || item?.kind === "plan") return "plan";
  if (block.kind === "commandExecution" || item?.kind === "commandExecution") return "command";
  if (block.kind === "fileChange" || item?.kind === "fileChange") return "fileChange";
  if (
    block.kind === "toolCall" ||
    block.kind === "mcpToolCall" ||
    block.kind === "collabToolCall" ||
    item?.kind === "toolCall" ||
    item?.kind === "mcpToolCall" ||
    item?.kind === "dynamicTool" ||
    item?.kind === "dynamicToolCall"
  ) {
    return "toolActivity";
  }
  if (block.kind === "webSearch" || item?.kind === "webSearch") return "web";
  if (block.kind === "image" || item?.kind === "image") return "media";
  if (block.kind === "systemInfo" || role === "system") return "system";
  return "unknown";
}

function transcriptLabelKey(
  item: AgentItemState | undefined,
  block: AgentItemBlock,
  role: AgentTranscriptEntry["role"],
): AgentI18nKey {
  if (role === "user") return "timeline.you";
  if (role === "assistant") return "timeline.assistant";
  if (item?.kind === "contextCompaction" || block.subtype === "compaction") {
    return "timeline.compaction";
  }
  switch (block.kind) {
    case "thinking":
      return "timeline.reasoning";
    case "plan":
      return "timeline.plan";
    case "commandExecution":
      return "timeline.command";
    case "fileChange":
      return "timeline.fileChange";
    case "collabToolCall":
      return "timeline.collab";
    case "toolCall":
    case "mcpToolCall":
      return "timeline.tool";
    case "webSearch":
      return "timeline.webSearch";
    case "image":
      return "timeline.image";
    case "systemInfo":
      return "timeline.system";
    default:
      return "timeline.unknown";
  }
}

function pinnedApprovalItemIdsByTurnId(
  thread: ThreadState | undefined,
  approvals?: AgentApprovalRequest[],
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
  approval: AgentApprovalRequest,
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
