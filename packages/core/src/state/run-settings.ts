import type { ReasoningEffort } from "./models";

export type AgentRunPolicyId = "review" | "auto" | "read-only" | "full-access" | string;

export interface RunSettingsState {
  policyId: AgentRunPolicyId;
  modelId?: string;
  effort?: ReasoningEffort;
  cwd?: string;
}
