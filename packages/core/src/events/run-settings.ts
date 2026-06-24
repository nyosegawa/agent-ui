import type { AgentRunPolicyId, ReasoningEffort } from "../state";

export type RunSettingsEvent = {
  type: "runSettings/updated";
  policyId?: AgentRunPolicyId;
  modelId?: string;
  effort?: ReasoningEffort;
  cwd?: string;
};
