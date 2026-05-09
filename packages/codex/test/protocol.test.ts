import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CODEX_PROTOCOL_COMMIT,
  stableClientMethods,
  stableNotificationMethods,
  stableServerRequestMethods,
} from "../src/protocol";
import { encodeJsonRpcLine, parseJsonRpcLine } from "../src/json-rpc";
import {
  normalizeCodexServerMessage,
  normalizeModelListResponse,
} from "../src/normalizer";

describe("Codex protocol metadata", () => {
  it("records upstream commit and stable release method surface", () => {
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

  it("normalizes structured App Server user content into display text", () => {
    expect(
      normalizeCodexServerMessage({
        method: "item/completed",
        params: {
          item: {
            content: [{ text: "Reply with exactly: agent-ui-ui-check", type: "text" }],
            id: "item-user",
            type: "userMessage",
          },
          threadId: "thread-real",
          turnId: "turn-real",
        },
      }),
    ).toMatchObject([
      {
        item: {
          id: "item-user",
          kind: "userMessage",
          status: "completed",
          text: "Reply with exactly: agent-ui-ui-check",
        },
        threadId: "thread-real",
        turnId: "turn-real",
        type: "item/completed",
      },
    ]);
  });

  it("normalizes plan and rate-limit notifications", () => {
    expect(
      normalizeCodexServerMessage({
        method: "turn/plan/updated",
        params: {
          explanation: "Do the work in order.",
          plan: [{ status: "inProgress", step: "Implement" }],
          threadId: "t1",
          turnId: "u1",
        },
      }),
    ).toEqual([
      {
        explanation: "Do the work in order.",
        plan: [{ status: "inProgress", step: "Implement" }],
        raw: {
          explanation: "Do the work in order.",
          plan: [{ status: "inProgress", step: "Implement" }],
          threadId: "t1",
          turnId: "u1",
        },
        threadId: "t1",
        turnId: "u1",
        type: "turn/plan/updated",
      },
    ]);

    expect(
      normalizeCodexServerMessage({
        method: "account/rateLimits/updated",
        params: { rateLimits: { planType: "plus" } },
      }),
    ).toEqual([{ rateLimits: { planType: "plus" }, type: "account/rateLimits/updated" }]);
  });

  it("normalizes current model/list data responses", () => {
    expect(
      normalizeModelListResponse({
        data: [
          {
            defaultReasoningEffort: "medium",
            displayName: "GPT-5.5",
            id: "gpt-5.5",
            isDefault: true,
            model: "gpt-5.5",
            supportedReasoningEfforts: [
              { description: "Fast", reasoningEffort: "low" },
              { description: "Deep", reasoningEffort: "high" },
            ],
          },
        ],
      }),
    ).toEqual([
      {
        defaultEffort: "medium",
        id: "gpt-5.5",
        name: "GPT-5.5",
        raw: {
          defaultReasoningEffort: "medium",
          displayName: "GPT-5.5",
          id: "gpt-5.5",
          isDefault: true,
          model: "gpt-5.5",
          supportedReasoningEfforts: [
            { description: "Fast", reasoningEffort: "low" },
            { description: "Deep", reasoningEffort: "high" },
          ],
        },
        supportedEfforts: ["low", "high"],
      },
    ]);
  });

  it("normalizes snake_case model/list data from App Server internals", () => {
    expect(
      normalizeModelListResponse({
        data: [
          {
            default_reasoning_effort: "medium",
            display_name: "Snake Case Model",
            id: "snake-case-model",
            supported_reasoning_efforts: [
              { description: "Balanced", reasoning_effort: "medium" },
              { description: "Deep", reasoning_effort: "high" },
            ],
          },
        ],
      }),
    ).toMatchObject([
      {
        defaultEffort: "medium",
        id: "snake-case-model",
        name: "Snake Case Model",
        supportedEfforts: ["medium", "high"],
      },
    ]);
  });

  it("snapshots generated stable protocol method lists", () => {
    expect(extractMethods("../src/generated/stable/ClientRequest.ts"))
      .toMatchInlineSnapshot(`
      [
        "account/login/cancel",
        "account/login/start",
        "account/logout",
        "account/rateLimits/read",
        "account/read",
        "account/sendAddCreditsNudgeEmail",
        "app/list",
        "command/exec",
        "command/exec/resize",
        "command/exec/terminate",
        "command/exec/write",
        "config/batchWrite",
        "config/mcpServer/reload",
        "config/read",
        "config/value/write",
        "configRequirements/read",
        "device/key/create",
        "device/key/public",
        "device/key/sign",
        "experimentalFeature/enablement/set",
        "experimentalFeature/list",
        "externalAgentConfig/detect",
        "externalAgentConfig/import",
        "feedback/upload",
        "fs/copy",
        "fs/createDirectory",
        "fs/getMetadata",
        "fs/readDirectory",
        "fs/readFile",
        "fs/remove",
        "fs/unwatch",
        "fs/watch",
        "fs/writeFile",
        "fuzzyFileSearch",
        "getAuthStatus",
        "getConversationSummary",
        "gitDiffToRemote",
        "hooks/list",
        "initialize",
        "marketplace/add",
        "marketplace/remove",
        "marketplace/upgrade",
        "mcpServer/oauth/login",
        "mcpServer/resource/read",
        "mcpServer/tool/call",
        "mcpServerStatus/list",
        "model/list",
        "modelProvider/capabilities/read",
        "plugin/install",
        "plugin/list",
        "plugin/read",
        "plugin/uninstall",
        "review/start",
        "skills/config/write",
        "skills/list",
        "thread/approveGuardianDeniedAction",
        "thread/archive",
        "thread/compact/start",
        "thread/fork",
        "thread/inject_items",
        "thread/list",
        "thread/loaded/list",
        "thread/metadata/update",
        "thread/name/set",
        "thread/read",
        "thread/resume",
        "thread/rollback",
        "thread/shellCommand",
        "thread/start",
        "thread/turns/list",
        "thread/unarchive",
        "thread/unsubscribe",
        "turn/interrupt",
        "turn/start",
        "turn/steer",
        "windowsSandbox/setupStart",
      ]
    `);
    expect(extractMethods("../src/generated/stable/ServerNotification.ts"))
      .toMatchInlineSnapshot(`
      [
        "account/login/completed",
        "account/rateLimits/updated",
        "account/updated",
        "app/list/updated",
        "command/exec/outputDelta",
        "configWarning",
        "deprecationNotice",
        "error",
        "externalAgentConfig/import/completed",
        "fs/changed",
        "fuzzyFileSearch/sessionCompleted",
        "fuzzyFileSearch/sessionUpdated",
        "guardianWarning",
        "hook/completed",
        "hook/started",
        "item/agentMessage/delta",
        "item/autoApprovalReview/completed",
        "item/autoApprovalReview/started",
        "item/commandExecution/outputDelta",
        "item/commandExecution/terminalInteraction",
        "item/completed",
        "item/fileChange/outputDelta",
        "item/fileChange/patchUpdated",
        "item/mcpToolCall/progress",
        "item/plan/delta",
        "item/reasoning/summaryPartAdded",
        "item/reasoning/summaryTextDelta",
        "item/reasoning/textDelta",
        "item/started",
        "mcpServer/oauthLogin/completed",
        "mcpServer/startupStatus/updated",
        "model/rerouted",
        "model/verification",
        "rawResponseItem/completed",
        "remoteControl/status/changed",
        "serverRequest/resolved",
        "skills/changed",
        "thread/archived",
        "thread/closed",
        "thread/compacted",
        "thread/goal/cleared",
        "thread/goal/updated",
        "thread/name/updated",
        "thread/realtime/closed",
        "thread/realtime/error",
        "thread/realtime/itemAdded",
        "thread/realtime/outputAudio/delta",
        "thread/realtime/sdp",
        "thread/realtime/started",
        "thread/realtime/transcript/delta",
        "thread/realtime/transcript/done",
        "thread/started",
        "thread/status/changed",
        "thread/tokenUsage/updated",
        "thread/unarchived",
        "turn/completed",
        "turn/diff/updated",
        "turn/plan/updated",
        "turn/started",
        "warning",
        "windows/worldWritableWarning",
        "windowsSandbox/setupCompleted",
      ]
    `);
    expect(extractMethods("../src/generated/stable/ServerRequest.ts"))
      .toMatchInlineSnapshot(`
      [
        "account/chatgptAuthTokens/refresh",
        "applyPatchApproval",
        "execCommandApproval",
        "item/commandExecution/requestApproval",
        "item/fileChange/requestApproval",
        "item/permissions/requestApproval",
        "item/tool/call",
        "item/tool/requestUserInput",
        "mcpServer/elicitation/request",
      ]
    `);
  });
});

function extractMethods(relativePath: string): string[] {
  const source = readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
  return [...source.matchAll(/"method": "([^"]+)"/g)]
    .map((match) => match[1])
    .filter((method): method is string => Boolean(method))
    .sort();
}
