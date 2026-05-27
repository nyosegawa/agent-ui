import type { ItemId, ThreadId, TurnId } from "./common";

export interface AgentItemState {
  id: ItemId;
  turnId: TurnId;
  threadId: ThreadId;
  kind: string;
  status: "inProgress" | "completed" | "failed";
  text?: string;
  raw?: unknown;
}

export type AgentItemBlockKind =
  | "text"
  | "thinking"
  | "plan"
  | "commandExecution"
  | "fileChange"
  | "toolCall"
  | "mcpToolCall"
  | "collabToolCall"
  | "webSearch"
  | "image"
  | "systemInfo"
  | "unknown";

export interface AgentItemBlock {
  id: ItemId;
  kind: AgentItemBlockKind;
  status?: AgentItemState["status"];
  text?: string;
  summary?: string;
  content?: string;
  command?: string;
  cwd?: string;
  output?: string;
  exitCode?: number;
  durationMs?: number;
  changes?: unknown[];
  tool?: string;
  toolType?: "mcp" | "dynamic" | "generic" | "collab";
  server?: string;
  arguments?: unknown;
  result?: unknown;
  error?: unknown;
  query?: string;
  path?: string;
  subtype?: "review_mode" | "compaction" | "unknown_item" | "error" | "status" | string;
  metadata?: Record<string, unknown>;
  raw?: unknown;
}
