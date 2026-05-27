import type { ExecutionModeId, ReasoningEffort } from "../state";

export type RunSettingsEvent = {
  type: "runSettings/updated";
  executionMode?: ExecutionModeId;
  modelId?: string;
  effort?: ReasoningEffort;
  cwd?: string;
};
