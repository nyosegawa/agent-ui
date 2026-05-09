import { describe, expect, it } from "vitest";
import type { TurnInterruptParams } from "../src/generated/stable/v2/TurnInterruptParams";
import type { ThreadStartParams } from "../src/generated/stable/v2/ThreadStartParams";
import type { TurnStartParams } from "../src/generated/stable/v2/TurnStartParams";

describe("stable thread workflow schema", () => {
  it("accepts the real local thread and turn params used by run settings", () => {
    const threadStart = {
      cwd: "/tmp/agent-ui",
      model: "gpt-5.3-codex",
    } satisfies ThreadStartParams;
    const turnStart = {
      approvalPolicy: "on-request",
      cwd: "/tmp/agent-ui",
      effort: "medium",
      input: [{ text: "hello", text_elements: [], type: "text" }],
      model: "gpt-5.3-codex",
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
      threadId: "thread-1",
    } satisfies TurnStartParams;
    const turnInterrupt = {
      threadId: "thread-1",
      turnId: "turn-1",
    } satisfies TurnInterruptParams;

    expect(threadStart.cwd).toBe("/tmp/agent-ui");
    expect(turnStart.sandboxPolicy.type).toBe("workspaceWrite");
    expect(turnInterrupt.turnId).toBe("turn-1");
  });
});
