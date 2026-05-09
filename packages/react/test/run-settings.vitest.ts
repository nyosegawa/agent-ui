import { describe, expect, it } from "vitest";
import { AGENT_EXECUTION_MODES } from "../src/hooks";

describe("AGENT_EXECUTION_MODES", () => {
  it("maps built-in execution modes only to stable turn/start params", () => {
    expect(
      AGENT_EXECUTION_MODES.map((mode) => ({
        id: mode.id,
        keys: Object.keys(mode.turnParams).sort(),
      })),
    ).toEqual([
      { id: "review", keys: ["approvalPolicy", "sandboxPolicy"] },
      { id: "auto", keys: ["approvalPolicy", "sandboxPolicy"] },
      { id: "read-only", keys: ["approvalPolicy", "sandboxPolicy"] },
      { id: "full-access", keys: ["approvalPolicy", "sandboxPolicy"] },
    ]);
    expect(AGENT_EXECUTION_MODES.map((mode) => mode.turnParams)).toEqual([
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
      {
        approvalPolicy: "never",
        sandboxPolicy: { type: "dangerFullAccess" },
      },
    ]);
  });
});
