import { describe, expect, it } from "vitest";
import type { CommandExecutionRequestApprovalResponse } from "../src/generated/stable/v2/CommandExecutionRequestApprovalResponse";
import type { FileChangeRequestApprovalResponse } from "../src/generated/stable/v2/FileChangeRequestApprovalResponse";

describe("stable approval response schema", () => {
  it("accepts command and file-change approval decisions used by the default UI", () => {
    const commandAccept = { decision: "accept" } satisfies CommandExecutionRequestApprovalResponse;
    const commandDecline = {
      decision: "decline",
    } satisfies CommandExecutionRequestApprovalResponse;
    const fileAccept = { decision: "accept" } satisfies FileChangeRequestApprovalResponse;
    const fileDecline = { decision: "decline" } satisfies FileChangeRequestApprovalResponse;

    expect([commandAccept, commandDecline, fileAccept, fileDecline]).toEqual([
      { decision: "accept" },
      { decision: "decline" },
      { decision: "accept" },
      { decision: "decline" },
    ]);
  });
});
