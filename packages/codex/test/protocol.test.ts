import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CODEX_PROTOCOL_COMMIT,
  codexCapabilityMetadata,
  experimentalAvailableMethods,
  hostOnlyMethods,
  stableAvailableMethods,
  stableClientMethods,
  stableNotificationMethods,
  stableProductizedMethods,
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
    expect(stableClientMethods).toBe(stableProductizedMethods);
    expect(stableProductizedMethods).toContain("account/rateLimits/read");
    expect(stableProductizedMethods).toContain("skills/list");
    expect(stableProductizedMethods).toContain("app/list");
    expect(hostOnlyMethods).toContain("command/exec");
    expect(experimentalAvailableMethods).toContain("thread/turns/items/list");
    expect(stableServerRequestMethods).toContain("item/commandExecution/requestApproval");
    expect(stableServerRequestMethods).toContain("attestation/generate");
    expect(stableNotificationMethods).toContain("item/agentMessage/delta");
  });

  it("keeps capability metadata partitioned without duplicates", () => {
    const metadataKeys = codexCapabilityMetadata.map((entry) => `${entry.status}:${entry.method}`);
    expect(new Set(metadataKeys).size).toBe(metadataKeys.length);
    expect(
      codexCapabilityMetadata.filter((entry) => entry.method === "account/rateLimits/read"),
    ).toEqual([{ method: "account/rateLimits/read", status: "stableProductized" }]);
    expect(codexCapabilityMetadata).toContainEqual({
      method: "thread/turns/list",
      status: "experimentalAvailable",
    });
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

  it("normalizes nested token usage notifications", () => {
    expect(
      normalizeCodexServerMessage({
        method: "thread/tokenUsage/updated",
        params: {
          threadId: "thread-usage",
          tokenUsage: {
            last: {
              cachedInputTokens: 3,
              inputTokens: 20,
              outputTokens: 10,
              reasoningOutputTokens: 4,
              totalTokens: 30,
            },
            modelContextWindow: 200,
            total: {
              cachedInputTokens: 11,
              inputTokens: 120,
              outputTokens: 30,
              reasoningOutputTokens: 10,
              totalTokens: 150,
            },
          },
          turnId: "turn-usage",
        },
      }),
    ).toEqual([
      {
        threadId: "thread-usage",
        tokenUsage: {
          cachedInputTokens: 11,
          inputTokens: 120,
          last: {
            cachedInputTokens: 3,
            inputTokens: 20,
            outputTokens: 10,
            reasoningOutputTokens: 4,
            totalTokens: 30,
          },
          modelContextWindow: 200,
          outputTokens: 30,
          raw: {
            threadId: "thread-usage",
            tokenUsage: {
              last: {
                cachedInputTokens: 3,
                inputTokens: 20,
                outputTokens: 10,
                reasoningOutputTokens: 4,
                totalTokens: 30,
              },
              modelContextWindow: 200,
              total: {
                cachedInputTokens: 11,
                inputTokens: 120,
                outputTokens: 30,
                reasoningOutputTokens: 10,
                totalTokens: 150,
              },
            },
            turnId: "turn-usage",
          },
          reasoningOutputTokens: 10,
          totalTokens: 150,
          turnId: "turn-usage",
        },
        type: "thread/tokenUsage/updated",
      },
    ]);
  });

  it("normalizes upstream threadName updates", () => {
    expect(
      normalizeCodexServerMessage({
        method: "thread/name/updated",
        params: { threadId: "thread-name", threadName: "Readable title" },
      }),
    ).toEqual([
      {
        name: "Readable title",
        threadId: "thread-name",
        type: "thread/name/updated",
      },
    ]);
  });

  it("normalizes dynamic tool call requests", () => {
    expect(
      normalizeCodexServerMessage({
        id: "tool-call-1",
        method: "item/tool/call",
        params: {
          arguments: { app: "Google Chrome" },
          callId: "call-1",
          namespace: "mcp__computer_use__",
          threadId: "thread-1",
          tool: "get_app_state",
          turnId: "turn-1",
        },
      }),
    ).toEqual([
      {
        request: {
          id: "tool-call-1",
          kind: "dynamicTool",
          payload: {
            arguments: { app: "Google Chrome" },
            callId: "call-1",
            namespace: "mcp__computer_use__",
            threadId: "thread-1",
            tool: "get_app_state",
            turnId: "turn-1",
          },
          threadId: "thread-1",
          turnId: "turn-1",
        },
        type: "serverRequest/created",
      },
    ]);
  });

  it("normalizes every productized server request kind", () => {
    const cases = [
      ["item/commandExecution/requestApproval", "commandApproval"],
      ["item/fileChange/requestApproval", "fileChangeApproval"],
      ["item/tool/requestUserInput", "userInput"],
      ["mcpServer/elicitation/request", "mcpElicitation"],
      ["item/permissions/requestApproval", "permissionsApproval"],
      ["item/tool/call", "dynamicTool"],
      ["account/chatgptAuthTokens/refresh", "authRefresh"],
      ["attestation/generate", "attestation"],
      ["execCommandApproval", "legacyExecApproval"],
      ["applyPatchApproval", "legacyPatchApproval"],
    ] as const;

    for (const [method, kind] of cases) {
      expect(
        normalizeCodexServerMessage({
          id: `request-${kind}`,
          method,
          params: { itemId: "item-1", threadId: "thread-1", turnId: "turn-1" },
        }),
      ).toMatchObject([
        {
          request: {
            id: `request-${kind}`,
            kind,
            itemId: "item-1",
            threadId: "thread-1",
            turnId: "turn-1",
          },
          type: "serverRequest/created",
        },
      ]);
    }
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

  it("normalizes diff, app, skills, and status notifications", () => {
    expect(
      normalizeCodexServerMessage({
        method: "turn/diff/updated",
        params: { diff: "diff --git a/a b/a", threadId: "t1", turnId: "u1" },
      }),
    ).toEqual([
      {
        diff: "diff --git a/a b/a",
        raw: { diff: "diff --git a/a b/a", threadId: "t1", turnId: "u1" },
        threadId: "t1",
        turnId: "u1",
        type: "turn/diff/updated",
      },
    ]);

    expect(
      normalizeCodexServerMessage({
        method: "app/list/updated",
        params: {
          data: [
            {
              id: "chrome",
              installUrl: "app://chrome",
              isAccessible: false,
              isEnabled: true,
              name: "Chrome",
            },
          ],
          threadId: "thread-apps",
        },
      }),
    ).toMatchObject([
      {
        apps: [
          {
            id: "chrome",
            installed: true,
            name: "Chrome",
            needsAuth: true,
            uri: "app://chrome",
          },
        ],
        nextCursor: null,
        threadId: "thread-apps",
        type: "apps/updated",
      },
    ]);

    expect(
      normalizeCodexServerMessage({
        method: "rawResponseItem/completed",
        params: { itemId: "item-raw", threadId: "thread-1", turnId: "turn-1" },
      }),
    ).toMatchObject([
      {
        notification: {
          method: "rawResponseItem/completed",
          params: { itemId: "item-raw", threadId: "thread-1", turnId: "turn-1" },
        },
        type: "notification/received",
      },
    ]);

    expect(normalizeCodexServerMessage({ method: "skills/changed", params: {} })).toEqual([
      {
        banner: {
          id: "skills-changed",
          kind: "system",
          message: "Skills changed. Re-run skills/list to refresh metadata.",
          raw: {},
        },
        type: "status/banner/added",
      },
    ]);

    expect(
      normalizeCodexServerMessage({
        method: "model/rerouted",
        params: {
          fromModel: "gpt-5.4",
          reason: "rateLimited",
          threadId: "t1",
          toModel: "gpt-5.5",
          turnId: "u1",
        },
      }),
    ).toMatchObject([{ banner: { kind: "modelReroute" }, type: "status/banner/added" }]);
  });

  it("turns unsupported notifications into neutral warnings without raw payloads", () => {
    expect(
      normalizeCodexServerMessage({
        method: "plugin/surprising/update",
        params: {
          nested: { token: "must-not-enter-state" },
          text: "raw JSON should not become a chat wall",
        },
      }),
    ).toEqual([
      {
        type: "warning/added",
        warning: {
          id: "unsupported-codex-notification:plugin/surprising/update",
          message: "Unsupported Codex notification: plugin/surprising/update",
        },
      },
    ]);
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
    const generatedStableClientMethods = extractMethods("../src/generated/stable/ClientRequest.ts");
    expect(stableAvailableMethods).toEqual(generatedStableClientMethods);
    expect(generatedStableClientMethods)
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
        "plugin/share/checkout",
        "plugin/share/delete",
        "plugin/share/list",
        "plugin/share/save",
        "plugin/share/updateTargets",
        "plugin/skill/read",
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
        "thread/unarchive",
        "thread/unsubscribe",
        "turn/interrupt",
        "turn/start",
        "turn/steer",
        "windowsSandbox/readiness",
        "windowsSandbox/setupStart",
      ]
    `);
    const generatedStableNotificationMethods = extractMethods(
      "../src/generated/stable/ServerNotification.ts",
    );
    expect(stableNotificationMethods).toEqual(generatedStableNotificationMethods);
    expect(generatedStableNotificationMethods)
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
        "process/exited",
        "process/outputDelta",
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
    const generatedStableServerRequestMethods = extractMethods(
      "../src/generated/stable/ServerRequest.ts",
    );
    expect(stableServerRequestMethods).toEqual(generatedStableServerRequestMethods);
    expect(generatedStableServerRequestMethods)
      .toMatchInlineSnapshot(`
      [
        "account/chatgptAuthTokens/refresh",
        "applyPatchApproval",
        "attestation/generate",
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

  it("snapshots generated experimental-only client methods", () => {
    const stable = extractMethods("../src/generated/stable/ClientRequest.ts");
    const experimental = extractMethods("../src/generated/experimental/ClientRequest.ts");
    const experimentalOnly = experimental.filter((method) => !stable.includes(method));
    expect(experimentalAvailableMethods).toEqual(experimentalOnly);
    expect(experimentalOnly).toMatchInlineSnapshot(`
      [
        "collaborationMode/list",
        "environment/add",
        "fuzzyFileSearch/sessionStart",
        "fuzzyFileSearch/sessionStop",
        "fuzzyFileSearch/sessionUpdate",
        "memory/reset",
        "mock/experimentalMethod",
        "process/kill",
        "process/resizePty",
        "process/spawn",
        "process/writeStdin",
        "remoteControl/disable",
        "remoteControl/enable",
        "thread/backgroundTerminals/clean",
        "thread/decrement_elicitation",
        "thread/goal/clear",
        "thread/goal/get",
        "thread/goal/set",
        "thread/increment_elicitation",
        "thread/memoryMode/set",
        "thread/realtime/appendAudio",
        "thread/realtime/appendText",
        "thread/realtime/listVoices",
        "thread/realtime/start",
        "thread/realtime/stop",
        "thread/turns/items/list",
        "thread/turns/list",
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
