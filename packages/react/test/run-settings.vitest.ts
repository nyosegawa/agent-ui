import { describe, expect, it } from "vitest";
import {
  AGENT_FULL_ACCESS_RUN_POLICY,
  DEFAULT_AGENT_RUN_POLICIES,
  agentRunPolicyTurnOptions,
} from "../src/hooks";

describe("DEFAULT_AGENT_RUN_POLICIES", () => {
  it("maps built-in run policies only to stable turn/start params", () => {
    expect(
      DEFAULT_AGENT_RUN_POLICIES.map((policy) => ({
        id: policy.id,
        keys: Object.keys(policy.turnOptions).sort(),
      })),
    ).toEqual([
      { id: "review", keys: ["approvalPolicy", "sandboxPolicy"] },
      { id: "auto", keys: ["approvalPolicy", "sandboxPolicy"] },
      { id: "read-only", keys: ["approvalPolicy", "sandboxPolicy"] },
    ]);
    expect(DEFAULT_AGENT_RUN_POLICIES.map((policy) => policy.turnOptions)).toEqual([
      {
        approvalPolicy: "on-request",
        sandboxPolicy: {
          excludeSlashTmp: false,
          excludeTmpdirEnvVar: false,
          networkAccess: false,
          type: "workspaceWrite",
          writableRoots: [],
        },
      },
      {
        approvalPolicy: "on-failure",
        sandboxPolicy: {
          excludeSlashTmp: false,
          excludeTmpdirEnvVar: false,
          networkAccess: false,
          type: "workspaceWrite",
          writableRoots: [],
        },
      },
      {
        approvalPolicy: "untrusted",
        sandboxPolicy: { networkAccess: false, type: "readOnly" },
      },
    ]);
    expect(AGENT_FULL_ACCESS_RUN_POLICY.turnOptions).toEqual({
      approvalPolicy: "never",
      sandboxPolicy: { type: "dangerFullAccess" },
    });
  });

  it("resolves only host-allowed run policies", () => {
    expect(
      agentRunPolicyTurnOptions("safe", [
        {
          description: "Host safe policy",
          id: "safe",
          label: "Safe",
          turnOptions: {
            approvalPolicy: "untrusted",
            sandboxPolicy: { networkAccess: false, type: "readOnly" },
          },
        },
      ]),
    ).toEqual({
      approvalPolicy: "untrusted",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
    });
    expect(
      agentRunPolicyTurnOptions("full-access", [
        {
          description: "Host safe policy",
          id: "safe",
          label: "Safe",
          turnOptions: {
            approvalPolicy: "untrusted",
            sandboxPolicy: { networkAccess: false, type: "readOnly" },
          },
        },
      ]),
    ).toEqual({
      approvalPolicy: "untrusted",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
    });
    expect(agentRunPolicyTurnOptions("full-access", [])).toEqual({
      approvalPolicy: "on-request",
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
    });
  });
});
