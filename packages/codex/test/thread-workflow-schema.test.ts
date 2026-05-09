import { describe, expect, it } from "bun:test";
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

    expect(threadStart.cwd).toBe("/tmp/agent-ui");
    expect(turnStart.sandboxPolicy.type).toBe("workspaceWrite");
  });
});
