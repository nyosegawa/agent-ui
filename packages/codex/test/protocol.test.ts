import { describe, expect, it } from "vitest";
import {
  CODEX_PROTOCOL_COMMIT,
  stableClientMethods,
  stableNotificationMethods,
  stableServerRequestMethods,
} from "../src/protocol";
import { encodeJsonRpcLine, parseJsonRpcLine } from "../src/json-rpc";
import { normalizeCodexServerMessage } from "../src/normalizer";

describe("Codex protocol metadata", () => {
  it("records upstream commit and stable MVP method surface", () => {
    expect(CODEX_PROTOCOL_COMMIT).toMatch(/^[0-9a-f]{40}$/);
    expect(stableClientMethods).toMatchInlineSnapshot(`
      [
        "initialize",
        "account/read",
        "account/login/start",
        "account/login/cancel",
        "account/logout",
        "model/list",
        "thread/start",
        "thread/resume",
        "thread/list",
        "thread/read",
        "thread/unsubscribe",
        "turn/start",
        "turn/steer",
        "turn/interrupt",
      ]
    `);
    expect(stableServerRequestMethods).toContain("item/commandExecution/requestApproval");
    expect(stableNotificationMethods).toContain("item/agentMessage/delta");
  });

  it("round trips JSON-RPC-lite lines without jsonrpc header", () => {
    const line = encodeJsonRpcLine({ id: 1, method: "initialize", params: {} });
    expect(line).toBe('{"id":1,"method":"initialize","params":{}}\n');
    expect(parseJsonRpcLine(line)).toEqual({ id: 1, method: "initialize", params: {} });
  });

  it("normalizes streaming text notifications", () => {
    expect(
      normalizeCodexServerMessage({
        method: "item/agentMessage/delta",
        params: { delta: "hi", itemId: "i1", threadId: "t1", turnId: "u1" },
      }),
    ).toEqual([
      {
        delta: "hi",
        itemId: "i1",
        threadId: "t1",
        turnId: "u1",
        type: "item/agentMessage/delta",
      },
    ]);
  });
});
