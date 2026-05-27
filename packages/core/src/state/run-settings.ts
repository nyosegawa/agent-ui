import type { ReasoningEffort } from "./models";

export type ExecutionModeId = "review" | "auto" | "read-only" | "full-access" | string;

export interface RunSettingsState {
  executionMode: ExecutionModeId;
  modelId?: string;
  effort?: ReasoningEffort;
  cwd?: string;
}
