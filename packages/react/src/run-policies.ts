import type { AgentRunPolicyId } from "@nyosegawa/agent-ui-core";
import type { TurnStartOptions } from "./request-options";

export type { AgentRunPolicyId } from "@nyosegawa/agent-ui-core";

export interface AgentRunPolicy {
  id: AgentRunPolicyId;
  label: string;
  description: string;
  turnOptions: TurnStartOptions;
}

export const AGENT_FULL_ACCESS_RUN_POLICY: AgentRunPolicy = {
  description: "Allow full local access for trusted one-off work.",
  id: "full-access",
  label: "Full access",
  turnOptions: {
    approvalPolicy: "never",
    sandboxPolicy: { type: "dangerFullAccess" },
  },
};

export const DEFAULT_AGENT_RUN_POLICIES: readonly AgentRunPolicy[] = [
  {
    description: "Ask before commands or file changes that need review.",
    id: "review",
    label: "Review",
    turnOptions: {
      approvalPolicy: "on-request",
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
    },
  },
  {
    description: "Run in the workspace and ask only after a command fails.",
    id: "auto",
    label: "Auto",
    turnOptions: {
      approvalPolicy: "on-failure",
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
    },
  },
  {
    description: "Read files and plan changes without writing to the workspace.",
    id: "read-only",
    label: "Read-only",
    turnOptions: {
      approvalPolicy: "untrusted",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
    },
  },
];

export function effectiveAgentRunPolicies(
  policies: readonly AgentRunPolicy[] | undefined,
): readonly AgentRunPolicy[] {
  return policies && policies.length > 0 ? policies : DEFAULT_AGENT_RUN_POLICIES;
}

export function resolvedAgentRunPolicyId(
  policyId: AgentRunPolicyId | undefined,
  policies: readonly AgentRunPolicy[],
): AgentRunPolicyId | undefined {
  return (policies.find((policy) => policy.id === policyId) ?? policies[0])?.id;
}

export function agentRunPolicyTurnOptions(
  policyId: AgentRunPolicyId | undefined,
  policies: readonly AgentRunPolicy[] = DEFAULT_AGENT_RUN_POLICIES,
): TurnStartOptions | undefined {
  const effectivePolicies = effectiveAgentRunPolicies(policies);
  return (
    effectivePolicies.find((policy) => policy.id === policyId) ?? effectivePolicies[0]
  )?.turnOptions;
}
