import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  agentReducer,
  createInitialAgentState,
  type AgentEvent,
} from "@nyosegawa/agent-ui-core";
import {
  CODEX_PROTOCOL_COMMIT,
  CODEX_PROTOCOL_GENERATED_AT,
  assertCodexExperimentalMethod,
  assertCodexProductizedMethod,
  codexCapabilityMetadata,
  codexInitializeParams,
  experimentalAvailableMethods,
  experimentalUnsupportedMethods,
  getCodexCapabilityStatus,
  hostOnlyMethods,
  isExperimentalAvailableMethod,
  isExperimentalUnsupportedMethod,
  isHostOnlyMethod,
  isStableProductizedMethod,
  stableAvailableMethods,
  stableClientMethods,
  stableNotificationMethods,
  stableProductizedMethods,
  stableServerRequestMethods,
} from "../src/protocol";
import { encodeJsonRpcLine, parseJsonRpcLine } from "../src/json-rpc";
import {
  normalizeAppsListResponse,
  normalizeCodexServerMessage,
  normalizeModelListResponse,
  normalizeThreadReadResponse,
} from "../src/normalizer";

describe("Codex protocol metadata", () => {
  it("records upstream commit and stable release method surface", () => {
    expect(CODEX_PROTOCOL_COMMIT).toMatch(/^[0-9a-f]{40}$/);
    expect(CODEX_PROTOCOL_GENERATED_AT).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stableClientMethods).toBe(stableProductizedMethods);
    expect(stableProductizedMethods).toContain("account/rateLimits/read");
    expect(stableProductizedMethods).toContain("skills/list");
    expect(stableProductizedMethods).toContain("app/list");
    expect(hostOnlyMethods).toContain("command/exec");
    expect(experimentalAvailableMethods).toContain("thread/turns/list");
    expect(experimentalUnsupportedMethods).toContain("thread/turns/items/list");
    expect(stableServerRequestMethods).toContain("item/commandExecution/requestApproval");
    expect(stableServerRequestMethods).toContain("attestation/generate");
    expect(stableNotificationMethods).toContain("item/agentMessage/delta");
  });

  it("keeps generated protocol metadata consistent across package records", () => {
    const packageJson = JSON.parse(
      readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
    ) as {
      agentUi?: {
        codexProtocolCommit?: string;
        generatedAt?: string;
      };
    };
    const readme = readFileSync(
      fileURLToPath(new URL("../src/generated/README.md", import.meta.url)),
      "utf8",
    );

    expect(packageJson.agentUi?.codexProtocolCommit).toBe(CODEX_PROTOCOL_COMMIT);
    expect(packageJson.agentUi?.generatedAt).toBe(CODEX_PROTOCOL_GENERATED_AT);
    expect(readme).toContain(`Upstream commit: \`${CODEX_PROTOCOL_COMMIT}\``);
    expect(readme).toContain(`Generated at: \`${CODEX_PROTOCOL_GENERATED_AT}\``);
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
    expect(codexCapabilityMetadata).toContainEqual({
      method: "thread/turns/items/list",
      status: "experimentalUnsupported",
    });
  });

  it("classifies methods for product clients and explicit experimental access", () => {
    expect(getCodexCapabilityStatus("thread/start")).toBe("stableProductized");
    expect(getCodexCapabilityStatus("command/exec")).toBe("hostOnly");
    expect(getCodexCapabilityStatus("thread/turns/list")).toBe("experimentalAvailable");
    expect(getCodexCapabilityStatus("thread/turns/items/list")).toBe(
      "experimentalUnsupported",
    );
    expect(getCodexCapabilityStatus("not/a/method")).toBeNull();

    expect(isStableProductizedMethod("thread/start")).toBe(true);
    expect(isStableProductizedMethod("command/exec")).toBe(false);
    expect(isHostOnlyMethod("command/exec")).toBe(true);
    expect(isExperimentalAvailableMethod("thread/turns/list")).toBe(true);
    expect(isExperimentalAvailableMethod("thread/turns/items/list")).toBe(false);
    expect(isExperimentalUnsupportedMethod("thread/turns/items/list")).toBe(true);
    expect(isStableProductizedMethod("skills/config/write")).toBe(true);
    expect(isHostOnlyMethod("config/value/write")).toBe(true);
    expect(isHostOnlyMethod("config/batchWrite")).toBe(true);

    expect(() => assertCodexProductizedMethod("thread/start")).not.toThrow();
    expect(() => assertCodexProductizedMethod("command/exec")).toThrow("hostOnly");
    expect(() => assertCodexProductizedMethod("skills/config/write")).not.toThrow();
    expect(() => assertCodexProductizedMethod("config/value/write")).toThrow("hostOnly");
    expect(() => assertCodexExperimentalMethod("thread/turns/list")).not.toThrow();
    expect(() => assertCodexExperimentalMethod("thread/turns/items/list")).toThrow(
      "experimentalUnsupported",
    );
    expect(() => assertCodexExperimentalMethod("thread/start")).toThrow(
      "stableProductized",
    );
  });

  it("round trips JSON-RPC-lite lines without jsonrpc header", () => {
    const line = encodeJsonRpcLine({ id: 1, method: "initialize", params: {} });
    expect(line).toBe('{"id":1,"method":"initialize","params":{}}\n');
    expect(parseJsonRpcLine(line)).toEqual({ id: 1, method: "initialize", params: {} });
  });

  it("normalizes initialize notification opt-out capabilities", () => {
    const clientInfo = { name: "agent-ui-test", title: null, version: "0.0.0" };

    expect(
      codexInitializeParams({
        capabilities: {
          experimentalApi: false,
          requestAttestation: false,
        },
        clientInfo,
      }).capabilities,
    ).toEqual({
      experimentalApi: false,
      requestAttestation: false,
    });
    expect(
      codexInitializeParams({
        capabilities: {
          experimentalApi: true,
          optOutNotificationMethods: ["thread/status/changed"],
          requestAttestation: false,
        },
        clientInfo,
      }).capabilities,
    ).toEqual({
      experimentalApi: true,
      optOutNotificationMethods: ["thread/status/changed"],
      requestAttestation: false,
    });
    expect(codexInitializeParams({ capabilities: null, clientInfo }).capabilities).toBeNull();
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

  it("normalizes item lifecycle notifications into reducer item state", () => {
    const events = [
      ...normalizeCodexServerMessage({
        method: "thread/started",
        params: { thread: { id: "thread-items", name: "Item lifecycle" } },
      }),
      ...normalizeCodexServerMessage({
        method: "turn/started",
        params: {
          threadId: "thread-items",
          turn: { id: "turn-items", status: "running" },
        },
      }),
      ...normalizeCodexServerMessage({
        method: "item/started",
        params: {
          item: {
            id: "agent-item",
            text: "",
            type: "agentMessage",
          },
          threadId: "thread-items",
          turnId: "turn-items",
        },
      }),
      ...normalizeCodexServerMessage({
        method: "item/agentMessage/delta",
        params: {
          delta: "Hello ",
          itemId: "agent-item",
          threadId: "thread-items",
          turnId: "turn-items",
        },
      }),
      ...normalizeCodexServerMessage({
        method: "item/agentMessage/delta",
        params: {
          delta: "world",
          itemId: "agent-item",
          threadId: "thread-items",
          turnId: "turn-items",
        },
      }),
      ...normalizeCodexServerMessage({
        method: "item/commandExecution/outputDelta",
        params: {
          delta: "bun test\n",
          itemId: "command-item",
          threadId: "thread-items",
          turnId: "turn-items",
        },
      }),
      ...normalizeCodexServerMessage({
        method: "item/fileChange/patchUpdated",
        params: {
          itemId: "patch-item",
          patch: "diff --git a/file.ts b/file.ts",
          threadId: "thread-items",
          turnId: "turn-items",
        },
      }),
      ...normalizeCodexServerMessage({
        method: "item/completed",
        params: {
          item: {
            id: "agent-item",
            text: "Hello world",
            type: "agentMessage",
          },
          threadId: "thread-items",
          turnId: "turn-items",
        },
      }),
    ];
    const state = events.reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );
    const turn = state.threads["thread-items"]?.turns["turn-items"];

    expect(events.map((event) => event.type)).toEqual([
      "thread/started",
      "turn/started",
      "item/started",
      "item/agentMessage/delta",
      "item/agentMessage/delta",
      "item/commandOutput/delta",
      "item/filePatch/updated",
      "item/completed",
    ]);
    expect(turn?.itemOrder).toEqual(["agent-item", "command-item", "patch-item"]);
    expect(turn?.items["agent-item"]).toMatchObject({
      id: "agent-item",
      kind: "agentMessage",
      status: "completed",
      text: "Hello world",
    });
    expect(turn?.streamingTextByItemId["agent-item"]).toBe("Hello world");
    expect(turn?.commandOutputByItemId["command-item"]).toBe("bun test\n");
    expect(turn?.filePatchByItemId["patch-item"]).toBe(
      "diff --git a/file.ts b/file.ts",
    );
  });

  it("normalizes thread/read responses into snapshot history events", () => {
    const events = normalizeThreadReadResponse({
      thread: {
        id: "thread-history",
        name: "Stored history",
        status: { type: "notLoaded" },
        turns: [
          {
            id: "turn-history",
            items: [
              {
                content: [{ text: "Please inspect this", type: "text" }],
                id: "item-user",
                type: "userMessage",
              },
              {
                aggregatedOutput: "bun test\nok\n",
                command: "bun test",
                id: "item-command",
                status: "completed",
                type: "commandExecution",
              },
              {
                changes: [{ path: "src/app.ts", type: "update" }],
                id: "item-file",
                status: "completed",
                type: "fileChange",
              },
            ],
            status: "completed",
          },
        ],
      },
    });
    const state = events.reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );
    const turn = state.threads["thread-history"]?.turns["turn-history"];

    expect(events.map((event) => event.type)).toEqual([
      "thread/started",
      "turn/completed",
      "item/commandOutput/delta",
      "item/filePatch/updated",
      "thread/status/changed",
    ]);
    expect(events[0]).toMatchObject({
      snapshot: true,
      status: "loaded",
      thread: { id: "thread-history", name: "Stored history" },
    });
    expect(events[1]).toMatchObject({
      items: [
        { id: "item-user", kind: "userMessage", status: "completed" },
        {
          id: "item-command",
          kind: "commandExecution",
          status: "completed",
          text: "bun test",
        },
        { id: "item-file", kind: "fileChange", status: "completed" },
      ],
      snapshot: true,
      type: "turn/completed",
    });
    expect(turn?.itemOrder).toEqual(["item-user", "item-command", "item-file"]);
    expect(turn?.commandOutputByItemId["item-command"]).toBe("bun test\nok\n");
    expect(turn?.filePatchByItemId["item-file"]).toEqual([
      { path: "src/app.ts", type: "update" },
    ]);
    expect(state.threads["thread-history"]?.status).toBe("loaded");
  });

  it("normalizes thread/read preview responses without activating them", () => {
    expect(
      normalizeThreadReadResponse(
        {
          id: "thread-preview",
          preview: "Investigate regression",
          status: { type: "idle" },
        },
        { activate: false },
      ),
    ).toMatchObject([
      {
        snapshot: true,
        status: "loaded",
        thread: { id: "thread-preview", name: "Investigate regression" },
        type: "thread/upserted",
      },
      {
        snapshot: true,
        status: "loaded",
        threadId: "thread-preview",
        type: "thread/status/changed",
      },
    ]);
    expect(() => normalizeThreadReadResponse({ thread: { name: "Broken" } })).toThrow(
      "thread/read response is missing a thread id",
    );
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

  it("does not retain normalized dynamic tool requests in core queue state", () => {
    let state = createInitialAgentState();
    for (const event of normalizeCodexServerMessage({
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
    })) {
      state = agentReducer(state, event);
    }

    expect(state.serverRequestQueue.order).toEqual([]);
    expect(state.serverRequestQueue.byId).toEqual({});
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
        method: "account/updated",
        params: { authMode: null, planType: null },
      }),
    ).toEqual([
      {
        account: { authMode: null, planType: null },
        status: "unauthenticated",
        type: "account/updated",
      },
    ]);

    expect(
      normalizeCodexServerMessage({
        method: "account/updated",
        params: { authMode: "chatgpt", planType: "plus" },
      }),
    ).toEqual([
      {
        account: { authMode: "chatgpt", planType: "plus" },
        status: "authenticated",
        type: "account/updated",
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

    expect(
      normalizeCodexServerMessage({
        method: "mcpServer/oauthLogin/completed",
        params: { name: "github", success: false },
      }),
    ).toMatchObject([
      {
        banner: {
          kind: "mcpOAuth",
          severity: "critical",
        },
        type: "status/banner/added",
      },
    ]);
  });

  it("normalizes app/list pagination responses and refresh notifications", () => {
    expect(
      normalizeAppsListResponse({
        data: [
          {
            id: "browser",
            installUrl: "app://browser",
            isAccessible: false,
            isEnabled: false,
            name: "Browser",
          },
        ],
        nextCursor: "page-2",
      }),
    ).toMatchObject({
      apps: [
        {
          id: "browser",
          installed: false,
          name: "Browser",
          needsAuth: true,
          uri: "app://browser",
        },
      ],
      nextCursor: "page-2",
    });

    expect(
      normalizeCodexServerMessage({
        method: "app/list/updated",
        params: {
          apps: [
            {
              id: "drive",
              isAccessible: true,
              isEnabled: true,
              name: "Drive",
              uri: "app://drive",
            },
          ],
          next_cursor: null,
          thread_id: "thread-apps",
        },
      }),
    ).toMatchObject([
      {
        apps: [
          {
            id: "drive",
            installed: true,
            name: "Drive",
            needsAuth: false,
            uri: "app://drive",
          },
        ],
        nextCursor: null,
        threadId: "thread-apps",
        type: "apps/updated",
      },
    ]);
  });

  it("decodes connection-scoped command/exec output deltas from base64", () => {
    expect(
      normalizeCodexServerMessage({
        method: "command/exec/outputDelta",
        params: {
          capReached: false,
          deltaBase64: "aGkK",
          processId: "process-1",
          stream: "stdout",
        },
      }),
    ).toEqual([
      {
        delta: "hi\n",
        itemId: "process-1",
        threadId: "",
        turnId: "",
        type: "item/commandOutput/delta",
      },
    ]);
  });

  it("normalizes schema-conformant error notifications", () => {
    expect(
      normalizeCodexServerMessage({
        method: "error",
        params: {
          error: {
            additionalDetails: "Try again later.",
            codexErrorInfo: { type: "rate_limit" },
            message: "Model overloaded",
          },
          threadId: "thread-error",
          turnId: "turn-error",
          willRetry: false,
        },
      }),
    ).toEqual([
      {
        error: {
          data: { type: "rate_limit" },
          message: "Model overloaded",
        },
        type: "error/added",
      },
    ]);
  });

  it("normalizes file change patch updates from top-level changes", () => {
    const events = [
      ...normalizeCodexServerMessage({
        method: "thread/started",
        params: { thread: { id: "thread-patch" } },
      }),
      ...normalizeCodexServerMessage({
        method: "turn/started",
        params: { threadId: "thread-patch", turn: { id: "turn-patch" } },
      }),
      ...normalizeCodexServerMessage({
        method: "item/fileChange/patchUpdated",
        params: {
          changes: [{ path: "README.md", type: "modify" }],
          itemId: "item-patch",
          threadId: "thread-patch",
          turnId: "turn-patch",
        },
      }),
    ];
    const state = events.reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );

    expect(events.at(-1)).toEqual({
      itemId: "item-patch",
      patch: [{ path: "README.md", type: "modify" }],
      threadId: "thread-patch",
      turnId: "turn-patch",
      type: "item/filePatch/updated",
    });
    expect(
      state.threads["thread-patch"]?.turns["turn-patch"]?.filePatchByItemId[
        "item-patch"
      ],
    ).toEqual([{ path: "README.md", type: "modify" }]);
  });

  it("preserves process notifications as raw protocol notifications", () => {
    expect(
      normalizeCodexServerMessage({
        method: "process/outputDelta",
        params: {
          capReached: false,
          deltaBase64: "aGkK",
          processHandle: "proc",
          stream: "stdout",
        },
      }),
    ).toMatchObject([
      {
        notification: {
          method: "process/outputDelta",
          params: {
            deltaBase64: "aGkK",
            processHandle: "proc",
            stream: "stdout",
          },
        },
        type: "notification/received",
      },
    ]);
    expect(
      normalizeCodexServerMessage({
        method: "process/exited",
        params: {
          exitCode: 0,
          processHandle: "proc",
          stderr: "",
          stderrCapReached: false,
          stdout: "hi\n",
          stdoutCapReached: false,
        },
      }),
    ).toMatchObject([
      {
        notification: {
          method: "process/exited",
          params: {
            exitCode: 0,
            processHandle: "proc",
          },
        },
        type: "notification/received",
      },
    ]);
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
          "permissionProfile/list",
          "plugin/install",
          "plugin/installed",
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
          "thread/goal/clear",
          "thread/goal/get",
          "thread/goal/set",
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
          "thread/settings/updated",
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
    expect(
      [...experimentalAvailableMethods, ...experimentalUnsupportedMethods].toSorted(),
    ).toEqual(experimentalOnly.toSorted());
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
        "remoteControl/status/read",
        "thread/backgroundTerminals/clean",
        "thread/decrement_elicitation",
        "thread/increment_elicitation",
        "thread/memoryMode/set",
        "thread/realtime/appendAudio",
        "thread/realtime/appendText",
        "thread/realtime/listVoices",
        "thread/realtime/start",
        "thread/realtime/stop",
        "thread/search",
        "thread/settings/update",
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
