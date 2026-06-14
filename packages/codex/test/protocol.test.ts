import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
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
  normalizeThreadLoadedListResponse,
  normalizeThreadListResponse,
  normalizeThreadReadResponse,
  normalizeThreadResumeResponse,
  normalizeThreadTurnsListResponse,
} from "../src/normalizer";
import { stableNotificationCoverage } from "../src/normalizers/notification-coverage";
import { generatedExperimentalOnlyClientMethods } from "../src/generated/protocol-capabilities";

describe("Codex protocol metadata", () => {
  it("records upstream commit and stable release method surface", () => {
    expect(CODEX_PROTOCOL_COMMIT).toMatch(/^[0-9a-f]{40}$/);
    expect(CODEX_PROTOCOL_COMMIT).toBe("5e9249ec0266f6331d1cb811d472c4d20cd5131d");
    expect(CODEX_PROTOCOL_GENERATED_AT).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stableClientMethods).toBe(stableProductizedMethods);
    expect(stableProductizedMethods).toContain("account/rateLimits/read");
    expect(stableProductizedMethods).toContain("account/usage/read");
    expect(stableProductizedMethods).toContain("skills/list");
    expect(stableProductizedMethods).toContain("app/list");
    expect(hostOnlyMethods).toContain("command/exec");
    expect(hostOnlyMethods).toContain("thread/delete");
    expect(experimentalAvailableMethods).toContain("thread/turns/list");
    expect(experimentalAvailableMethods).toContain("thread/backgroundTerminals/list");
    expect(experimentalAvailableMethods).toContain(
      "thread/backgroundTerminals/terminate",
    );
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

  it("keeps the Codex submodule pointer aligned with generated protocol metadata", () => {
    const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
    const gitlink = execFileSync("git", ["ls-tree", "HEAD", "third_party/codex"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    const match = /^160000 commit ([0-9a-f]{40})\tthird_party\/codex$/.exec(gitlink);

    expect(match?.[1]).toBe(CODEX_PROTOCOL_COMMIT);
  });

  it("keeps capability metadata partitioned without duplicates", () => {
    const metadataKeys = codexCapabilityMetadata.map((entry) => `${entry.status}:${entry.method}`);
    const metadataMethods = codexCapabilityMetadata.map((entry) => entry.method);
    expect(new Set(metadataKeys).size).toBe(metadataKeys.length);
    expect(new Set(metadataMethods).size).toBe(metadataMethods.length);
    expect(
      codexCapabilityMetadata.filter((entry) => entry.method === "account/rateLimits/read"),
    ).toEqual([{ method: "account/rateLimits/read", status: "stableProductized" }]);
    expect(
      codexCapabilityMetadata.filter((entry) => entry.method === "account/usage/read"),
    ).toEqual([{ method: "account/usage/read", status: "stableProductized" }]);
    expect(codexCapabilityMetadata).toContainEqual({
      method: "thread/turns/list",
      status: "experimentalAvailable",
    });
    expect(codexCapabilityMetadata).toContainEqual({
      method: "thread/turns/items/list",
      status: "experimentalUnsupported",
    });
    expect(
      codexCapabilityMetadata.some((entry) => entry.method === "mock/experimentalMethod"),
    ).toBe(false);
  });

  it("requires every generated client method to have an explicit capability decision", () => {
    const classifiedStableMethods = new Set<string>([
      ...stableProductizedMethods,
      ...hostOnlyMethods,
    ]);
    const classifiedExperimentalMethods = new Set<string>([
      ...experimentalAvailableMethods,
      ...experimentalUnsupportedMethods,
      "mock/experimentalMethod",
    ]);

    expect(stableAvailableMethods.filter((method) => !classifiedStableMethods.has(method))).toEqual(
      [],
    );
    expect(
      generatedExperimentalOnlyClientMethods.filter(
        (method) => !classifiedExperimentalMethods.has(method),
      ),
    ).toEqual([]);
  });

  it("classifies methods for product clients and explicit experimental access", () => {
    expect(getCodexCapabilityStatus("thread/start")).toBe("stableProductized");
    expect(getCodexCapabilityStatus("command/exec")).toBe("hostOnly");
    expect(getCodexCapabilityStatus("thread/turns/list")).toBe("experimentalAvailable");
    expect(getCodexCapabilityStatus("thread/turns/items/list")).toBe(
      "experimentalUnsupported",
    );
    expect(getCodexCapabilityStatus("mock/experimentalMethod")).toBeNull();
    expect(getCodexCapabilityStatus("not/a/method")).toBeNull();

    expect(isStableProductizedMethod("thread/start")).toBe(true);
    expect(isStableProductizedMethod("thread/delete")).toBe(false);
    expect(isStableProductizedMethod("command/exec")).toBe(false);
    expect(isHostOnlyMethod("command/exec")).toBe(true);
    expect(isHostOnlyMethod("thread/delete")).toBe(true);
    expect(isExperimentalAvailableMethod("thread/turns/list")).toBe(true);
    expect(isExperimentalAvailableMethod("remoteControl/pairing/start")).toBe(true);
    expect(isExperimentalAvailableMethod("mock/experimentalMethod")).toBe(false);
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
    expect(() => assertCodexExperimentalMethod("mock/experimentalMethod")).toThrow(
      "unknown",
    );
    expect(() => assertCodexExperimentalMethod("thread/start")).toThrow(
      "stableProductized",
    );
  });

  it("keeps protocol docs method-list sections aligned with capability metadata", () => {
    const docs = readFileSync(
      fileURLToPath(new URL("../../../docs/reference/codex-protocol.md", import.meta.url)),
      "utf8",
    );

    expect(extractDocumentedMethods(docs, "Stable productized methods")).toEqual(
      [...stableProductizedMethods].sort(),
    );
    expect(extractDocumentedMethods(docs, "Host-only or advanced local tooling")).toEqual(
      [...hostOnlyMethods].sort(),
    );
    expect(extractDocumentedMethods(docs, "Experimental available methods")).toEqual(
      [...experimentalAvailableMethods].sort(),
    );
    expect(extractDocumentedMethods(docs, "Experimental test-only methods")).toEqual([
      "mock/experimentalMethod",
    ]);
    expect(extractDocumentedMethods(docs, "Experimental unsupported methods")).toEqual(
      [...experimentalUnsupportedMethods].sort(),
    );
  });

  it("normalizes server requests only through the exact generated method table", () => {
    const expectedKinds = {
      "account/chatgptAuthTokens/refresh": "authRefresh",
      applyPatchApproval: "legacyPatchApproval",
      "attestation/generate": "attestation",
      execCommandApproval: "legacyExecApproval",
      "item/commandExecution/requestApproval": "commandApproval",
      "item/fileChange/requestApproval": "fileChangeApproval",
      "item/permissions/requestApproval": "permissionsApproval",
      "item/tool/call": "dynamicTool",
      "item/tool/requestUserInput": "userInput",
      "mcpServer/elicitation/request": "mcpElicitation",
    };

    expect(Object.keys(expectedKinds).sort()).toEqual([...stableServerRequestMethods].sort());
    for (const method of stableServerRequestMethods) {
      expect(
        normalizeCodexServerMessage({
          id: `request-${method}`,
          method,
          params: { itemId: "item-1", threadId: "thread-1", turnId: "turn-1" },
        }),
      ).toEqual([
        {
          request: {
            id: `request-${method}`,
            itemId: "item-1",
            kind: expectedKinds[method],
            payload: { itemId: "item-1", threadId: "thread-1", turnId: "turn-1" },
            threadId: "thread-1",
            turnId: "turn-1",
          },
          type: "serverRequest/created",
        },
      ]);
    }

    expect(
      normalizeCodexServerMessage({
        id: "unknown-approval-substring",
        method: "item/fake/requestApproval",
        params: {},
      }),
    ).toEqual([
      {
        type: "warning/added",
        warning: {
          audience: ["developer", "audit"],
          id: "unsupported-codex-notification:item/fake/requestApproval",
          message: "Unsupported Codex notification: item/fake/requestApproval",
        },
      },
    ]);
  });

  it("preserves JSON-RPC-lite request id types for stable server request kinds", () => {
    for (const [index, method] of stableServerRequestMethods.entries()) {
      const id = index % 2 === 0 ? 0 : "0";
      expect(
        normalizeCodexServerMessage({
          id,
          method,
          params: { threadId: "thread-ids" },
        }),
      ).toMatchObject([
        {
          request: {
            id,
            threadId: "thread-ids",
          },
          type: "serverRequest/created",
        },
      ]);
    }

    expect(
      normalizeCodexServerMessage({
        method: "serverRequest/resolved",
        params: { requestId: 0 },
      }),
    ).toEqual([{ requestId: 0, type: "serverRequest/resolved" }]);
    expect(
      normalizeCodexServerMessage({
        method: "serverRequest/resolved",
        params: { requestId: "0" },
      }),
    ).toEqual([{ requestId: "0", type: "serverRequest/resolved" }]);
  });

  it("classifies every stable notification by coverage policy", () => {
    expect(Object.keys(stableNotificationCoverage).sort()).toEqual([
      ...stableNotificationMethods,
    ].sort());
    expect(new Set(Object.values(stableNotificationCoverage))).toEqual(
      new Set(["mapped", "raw"]),
    );

    expect(stableNotificationCoverage["item/agentMessage/delta"]).toBe("mapped");
    expect(stableNotificationCoverage["rawResponseItem/completed"]).toBe("raw");
    expect(stableNotificationCoverage["thread/compacted"]).toBe("raw");
    expect(stableNotificationCoverage["thread/deleted"]).toBe("raw");
    expect(stableNotificationCoverage["thread/goal/cleared"]).toBe("raw");
    expect(stableNotificationCoverage["thread/goal/updated"]).toBe("raw");
    expect(stableNotificationCoverage["thread/settings/updated"]).toBe("raw");
    expect(
      normalizeCodexServerMessage({
        method: "rawResponseItem/completed",
        params: { itemId: "raw-item", threadId: "thread-1", turnId: "turn-1" },
      }),
    ).toMatchObject([
      {
        notification: {
          method: "rawResponseItem/completed",
          params: { itemId: "raw-item", threadId: "thread-1", turnId: "turn-1" },
        },
        type: "notification/received",
      },
    ]);
  });

  it("preserves compact, goal, and settings notifications as host-owned raw diagnostics", () => {
    const events = [
      ...normalizeCodexServerMessage({
        method: "thread/compacted",
        params: { threadId: "thread-host", turnId: "turn-compact" },
      }),
      ...normalizeCodexServerMessage({
        method: "thread/goal/updated",
        params: {
          goal: {
            createdAt: 1,
            objective: "Host-owned objective",
            status: "active",
            threadId: "thread-host",
            timeUsedSeconds: 0,
            tokenBudget: null,
            tokensUsed: 0,
            updatedAt: 2,
          },
          threadId: "thread-host",
          turnId: null,
        },
      }),
      ...normalizeCodexServerMessage({
        method: "thread/goal/cleared",
        params: { threadId: "thread-host" },
      }),
      ...normalizeCodexServerMessage({
        method: "thread/settings/updated",
        params: {
          threadId: "thread-host",
          threadSettings: {
            approvalPolicy: "on-request",
            approvalsReviewer: "user",
            collaborationMode: "default",
            cwd: "/workspace",
            effort: null,
            model: "gpt-5",
            modelProvider: "openai",
            personality: null,
            sandboxPolicy: { type: "workspace-write" },
            serviceTier: null,
            summary: null,
          },
        },
      }),
    ];
    const state = events.reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );

    expect(events.map((event) => event.type)).toEqual([
      "notification/received",
      "notification/received",
      "notification/received",
      "notification/received",
    ]);
    expect(events).toMatchObject([
      {
        notification: {
          audience: ["developer", "audit"],
          method: "thread/compacted",
          params: { threadId: "thread-host", turnId: "turn-compact" },
        },
      },
      {
        notification: {
          audience: ["developer", "audit"],
          method: "thread/goal/updated",
          params: { threadId: "thread-host", turnId: null },
        },
      },
      {
        notification: {
          audience: ["developer", "audit"],
          method: "thread/goal/cleared",
          params: { threadId: "thread-host" },
        },
      },
      {
        notification: {
          audience: ["developer", "audit"],
          method: "thread/settings/updated",
          params: { threadId: "thread-host" },
        },
      },
    ]);
    expect(state.threads).toEqual({});
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

  it("normalizes thread/list responses into scoped lifecycle collections", () => {
    const page = normalizeThreadListResponse(
      {
        backwardsCursor: "cursor-newer",
        data: [
          {
            cwd: "/workspace/one",
            ephemeral: false,
            id: "thread-list-one",
            name: "Listed thread",
            preview: "Listed preview",
            status: { type: "idle" },
          },
          {
            cwd: "/workspace/one",
            ephemeral: false,
            id: "thread-list-two",
            preview: "Archived preview",
            status: { type: "notLoaded" },
          },
        ],
        nextCursor: "cursor-older",
      },
      {
        scope: {
          archived: true,
          cwd: "/workspace/one",
          key: "history:/workspace/one::true",
          kind: "history",
        },
        syncedAt: 1_765_000_000_000,
      },
    );
    let state = page.events.reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );

    expect(page).toMatchObject({
      backwardsCursor: "cursor-newer",
      ids: ["thread-list-one", "thread-list-two"],
      nextCursor: "cursor-older",
    });
    expect(page.events.map((event) => event.type)).toEqual([
      "thread/upserted",
      "thread/upserted",
      "thread/collection/pageReceived",
    ]);
    expect(state.threadLifecycle.collections["history:/workspace/one::true"]).toMatchObject({
      ids: ["thread-list-one", "thread-list-two"],
      nextCursor: "cursor-older",
      status: "ready",
      syncedAt: 1_765_000_000_000,
    });
    expect(state.threads["thread-list-one"]?.availability).toBe("archived");
    expect(state.threads["thread-list-one"]?.metadata).toMatchObject({
      cwd: "/workspace/one",
      title: "Listed thread",
    });
    const unarchivedPage = normalizeThreadListResponse(
      {
        data: [
          {
            cwd: "/workspace/one",
            id: "thread-list-one",
            name: "Listed thread",
            status: { type: "idle" },
          },
        ],
      },
      {
        scope: {
          archived: false,
          cwd: "/workspace/one",
          key: "history:/workspace/one::false",
          kind: "history",
        },
      },
    );
    state = unarchivedPage.events.reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      state,
    );
    expect(state.threads["thread-list-one"]?.status).toBe("loaded");
    expect(state.threads["thread-list-one"]?.availability).toBe("available");
    expect(() => normalizeThreadListResponse({ data: [{ name: "Broken" }] })).toThrow(
      "thread/list response contains a thread without an id",
    );
  });

  it("normalizes thread/loaded/list ids without inventing thread entities", () => {
    const page = normalizeThreadLoadedListResponse(
      {
        data: ["thread-loaded-one", "thread-loaded-two"],
        nextCursor: "cursor-loaded",
      },
      {
        syncedAt: 1_765_000_000_001,
      },
    );
    const state = page.events.reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );

    expect(page).toMatchObject({
      ids: ["thread-loaded-one", "thread-loaded-two"],
      nextCursor: "cursor-loaded",
      scope: { key: "loaded", kind: "custom", label: "Loaded threads" },
    });
    expect(page.events).toMatchObject([
      {
        ids: ["thread-loaded-one", "thread-loaded-two"],
        nextCursor: "cursor-loaded",
        replace: true,
        scope: { key: "loaded", kind: "custom", label: "Loaded threads" },
        syncedAt: 1_765_000_000_001,
        type: "thread/collection/pageReceived",
      },
    ]);
    expect(state.threadLifecycle.collections.loaded).toMatchObject({
      ids: ["thread-loaded-one", "thread-loaded-two"],
      nextCursor: "cursor-loaded",
      status: "ready",
      syncedAt: 1_765_000_000_001,
    });
    expect(state.threads).toEqual({});
    expect(() => normalizeThreadLoadedListResponse({ data: ["ok", null] })).toThrow(
      "thread/loaded/list response contains an invalid thread id",
    );
    expect(() => normalizeThreadLoadedListResponse({ data: ["ok", 123] })).toThrow(
      "thread/loaded/list response contains an invalid thread id",
    );
  });

  it("normalizes thread/turns/list pages into chronological non-duplicating snapshots", () => {
    const firstPage = normalizeThreadTurnsListResponse(
      {
        backwardsCursor: "cursor-newer-from-turn-3",
        data: [
          {
            id: "turn-3",
            items: [{ id: "item-3", text: "third", type: "agentMessage" }],
            itemsView: "summary",
            status: "completed",
          },
          {
            id: "turn-2",
            items: [{ id: "item-2", text: "second", type: "agentMessage" }],
            itemsView: "summary",
            status: "completed",
          },
        ],
        nextCursor: "cursor-older-from-turn-2",
      },
      { threadId: "thread-paged", sortDirection: "desc" },
    );
    const olderAnchorPage = normalizeThreadTurnsListResponse(
      {
        data: [
          {
            id: "turn-2",
            items: [{ id: "item-2", text: "second refreshed", type: "agentMessage" }],
            itemsView: "summary",
            status: "completed",
          },
          {
            id: "turn-1",
            items: [{ id: "item-1", text: "first", type: "agentMessage" }],
            itemsView: "summary",
            status: "completed",
          },
        ],
        nextCursor: null,
      },
      { threadId: "thread-paged", sortDirection: "desc" },
    );
    const newerAnchorPage = normalizeThreadTurnsListResponse(
      {
        data: [
          {
            id: "turn-3",
            items: [{ id: "item-3", text: "third refreshed", type: "agentMessage" }],
            itemsView: "summary",
            status: "completed",
          },
          {
            id: "turn-4",
            items: [{ id: "item-4", text: "fourth", type: "agentMessage" }],
            itemsView: "summary",
            status: "completed",
          },
        ],
      },
      { threadId: "thread-paged", sortDirection: "asc" },
    );
    const state = [
      ...firstPage.events,
      ...olderAnchorPage.events,
      ...newerAnchorPage.events,
    ].reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );

    expect(firstPage).toMatchObject({
      backwardsCursor: "cursor-newer-from-turn-3",
      nextCursor: "cursor-older-from-turn-2",
      sortDirection: "desc",
      turns: [{ id: "turn-2" }, { id: "turn-3" }],
    });
    expect(state.threads["thread-paged"]?.orderedTurnIds).toEqual([
      "turn-1",
      "turn-2",
      "turn-3",
      "turn-4",
    ]);
    expect(state.threads["thread-paged"]?.turns["turn-2"]?.turn.itemsView).toBe("summary");
    expect(state.threads["thread-paged"]?.turns["turn-2"]?.items["item-2"]?.text).toBe(
      "second refreshed",
    );
    expect(state.threads["thread-paged"]?.turns["turn-3"]?.items["item-3"]?.text).toBe(
      "third refreshed",
    );
  });

  it("normalizes thread/resume initial turns pages without replacing stored transcript data", () => {
    const existing = normalizeThreadReadResponse({
      thread: {
        id: "thread-resume-page",
        name: "Resume page",
        status: { type: "idle" },
        turns: [
          {
            id: "turn-existing",
            items: [
              {
                id: "item-existing",
                text: "full persisted text",
                type: "agentMessage",
              },
            ],
            itemsView: "full",
            status: "completed",
          },
        ],
      },
    });
    const resume = normalizeThreadResumeResponse({
      initialTurnsPage: {
        data: [
          {
            id: "turn-new",
            items: [{ id: "item-new", text: "new summary", type: "agentMessage" }],
            itemsView: "summary",
            status: "completed",
          },
          {
            id: "turn-existing",
            items: [
              {
                id: "item-existing",
                text: "summary text",
                type: "agentMessage",
              },
            ],
            itemsView: "summary",
            status: "completed",
          },
        ],
        nextCursor: null,
      },
      thread: {
        id: "thread-resume-page",
        name: "Resume page updated",
        status: { type: "active" },
      },
    });
    const state = [...existing, ...resume.events].reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );

    expect(resume.initialTurnsPage).toMatchObject({
      nextCursor: null,
      sortDirection: "desc",
      turns: [{ id: "turn-existing" }, { id: "turn-new" }],
    });
    expect(state.threads["thread-resume-page"]?.thread.name).toBe("Resume page updated");
    expect(state.threads["thread-resume-page"]?.status).toBe("running");
    expect(state.threads["thread-resume-page"]?.orderedTurnIds).toEqual([
      "turn-existing",
      "turn-new",
    ]);
    expect(
      state.threads["thread-resume-page"]?.turns["turn-existing"]?.items["item-existing"]?.text,
    ).toBe("full persisted text");
    expect(state.threads["thread-resume-page"]?.turns["turn-existing"]?.turn.itemsView).toBe(
      "full",
    );
    expect(state.threads["thread-resume-page"]?.turns["turn-new"]?.items["item-new"]?.text).toBe(
      "new summary",
    );
  });

  it("normalizes resumed idle threads as ready after stored history hydration", () => {
    const existing = normalizeThreadReadResponse({
      thread: {
        id: "thread-resumed-idle",
        name: "Resumed idle",
        status: { type: "notLoaded" },
        turns: [
          {
            id: "turn-existing",
            items: [{ id: "item-existing", text: "persisted", type: "agentMessage" }],
            status: "completed",
          },
        ],
      },
    });
    const resume = normalizeThreadResumeResponse({
      thread: {
        id: "thread-resumed-idle",
        name: "Resumed idle",
        status: { type: "idle" },
      },
    });
    const state = [...existing, ...resume.events].reduce(
      (current, event) => agentReducer(current, event as AgentEvent),
      createInitialAgentState(),
    );

    expect(resume.events).toMatchObject([
      { status: "ready", type: "thread/started" },
      { status: "ready", type: "thread/status/changed" },
    ]);
    expect(state.threads["thread-resumed-idle"]?.status).toBe("ready");
    expect(state.threads["thread-resumed-idle"]?.orderedTurnIds).toEqual(["turn-existing"]);
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

  it("normalizes productized thread lifecycle notifications consistently", () => {
    let state = agentReducer(createInitialAgentState(), {
      status: "ready",
      thread: { id: "thread-lifecycle", name: "Lifecycle" },
      type: "thread/started",
    });
    const cases = [
      ["thread/status/changed", { status: { type: "active" } }, "running"],
      ["thread/archived", {}, "archived"],
      ["thread/unarchived", {}, "loaded"],
      ["thread/closed", {}, "closed"],
    ] as const;

    for (const [method, params, status] of cases) {
      const events = normalizeCodexServerMessage({
        method,
        params: { ...params, threadId: "thread-lifecycle" },
      });
      state = events.reduce(
        (current, event) => agentReducer(current, event as AgentEvent),
        state,
      );

      expect(events).toEqual([
        {
          status,
          threadId: "thread-lifecycle",
          type: "thread/status/changed",
        },
      ]);
      expect(state.threads["thread-lifecycle"]?.status).toBe(status);
    }
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
              description: "Browser automation",
              id: "chrome",
              installUrl: "app://chrome",
              isAccessible: false,
              isEnabled: true,
              labels: { category: "browser" },
              logoUrl: "https://example.test/chrome-light.png",
              logoUrlDark: "https://example.test/chrome-dark.png",
              distributionChannel: "bundled",
              appMetadata: { vendor: "google" },
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
            accessible: false,
            description: "Browser automation",
            distributionChannel: "bundled",
            enabled: true,
            id: "chrome",
            installUrl: "app://chrome",
            appMetadata: { vendor: "google" },
            labels: { category: "browser" },
            logoUrl: "https://example.test/chrome-light.png",
            logoUrlDark: "https://example.test/chrome-dark.png",
            logos: {
              dark: "https://example.test/chrome-dark.png",
              light: "https://example.test/chrome-light.png",
            },
            metadata: { vendor: "google" },
            name: "Chrome",
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
          audience: ["developer", "audit"],
          method: "rawResponseItem/completed",
          params: { itemId: "item-raw", threadId: "thread-1", turnId: "turn-1" },
        },
        type: "notification/received",
      },
    ]);

    expect(normalizeCodexServerMessage({ method: "skills/changed", params: {} })).toEqual([
      {
        banner: {
          audience: ["user"],
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
    const response = normalizeAppsListResponse({
      data: [
        {
          branding: { color: "blue" },
          description: "Open browser",
          distributionChannel: "marketplace",
          id: "browser",
          installUrl: "app://browser",
          isAccessible: false,
          isEnabled: false,
          appMetadata: { category: "automation" },
          logoUrl: "https://example.test/browser-light.png",
          logoUrlDark: "https://example.test/browser-dark.png",
          name: "Browser",
          pluginDisplayNames: ["browser-tools"],
        },
      ],
      nextCursor: "page-2",
    });
    expect(response).toMatchObject({
      apps: [
        {
          accessible: false,
          branding: { color: "blue" },
          description: "Open browser",
          distributionChannel: "marketplace",
          enabled: false,
          id: "browser",
          installUrl: "app://browser",
          appMetadata: { category: "automation" },
          logoUrl: "https://example.test/browser-light.png",
          logoUrlDark: "https://example.test/browser-dark.png",
          logos: {
            dark: "https://example.test/browser-dark.png",
            light: "https://example.test/browser-light.png",
          },
          metadata: { category: "automation" },
          name: "Browser",
          pluginDisplayNames: ["browser-tools"],
          uri: "app://browser",
        },
      ],
      nextCursor: "page-2",
    });
    expect(response.apps[0]).not.toHaveProperty("installed");
    expect(response.apps[0]).not.toHaveProperty("needsAuth");

    expect(
      normalizeCodexServerMessage({
        method: "app/list/updated",
        params: {
          apps: [
            {
              appMetadata: { vendor: "google" },
              distributionChannel: "bundled",
              id: "drive",
              installUrl: "app://drive",
              isAccessible: true,
              isEnabled: true,
              logoUrl: "https://example.test/drive-light.png",
              logoUrlDark: null,
              name: "Drive",
              pluginDisplayNames: ["Drive Plugin"],
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
            accessible: true,
            appMetadata: { vendor: "google" },
            distributionChannel: "bundled",
            enabled: true,
            id: "drive",
            installUrl: "app://drive",
            logoUrl: "https://example.test/drive-light.png",
            logos: {
              light: "https://example.test/drive-light.png",
            },
            metadata: { vendor: "google" },
            name: "Drive",
            pluginDisplayNames: ["Drive Plugin"],
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
          audience: ["user"],
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
          audience: ["developer", "audit"],
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
        isDefault: true,
        name: "GPT-5.5",
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
          "account/usage/read",
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
          "skills/extraRoots/set",
          "skills/list",
          "thread/approveGuardianDeniedAction",
          "thread/archive",
          "thread/compact/start",
          "thread/delete",
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
          "thread/deleted",
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
          "turn/moderationMetadata",
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
    const testOnlyExperimentalMethods = ["mock/experimentalMethod"];
    expect(
      [
        ...experimentalAvailableMethods,
        ...experimentalUnsupportedMethods,
        ...testOnlyExperimentalMethods,
      ].toSorted(),
    ).toEqual(experimentalOnly.toSorted());
    expect(experimentalAvailableMethods).not.toContain("mock/experimentalMethod");
    expect(experimentalUnsupportedMethods).not.toContain("mock/experimentalMethod");
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
        "remoteControl/client/list",
        "remoteControl/client/revoke",
        "remoteControl/disable",
        "remoteControl/enable",
        "remoteControl/pairing/start",
        "remoteControl/pairing/status",
        "remoteControl/status/read",
        "thread/backgroundTerminals/clean",
        "thread/backgroundTerminals/list",
        "thread/backgroundTerminals/terminate",
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

function extractDocumentedMethods(markdown: string, sectionTitle: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim() === `${sectionTitle}:`);
  if (startIndex === -1) {
    throw new Error(`Missing protocol docs section: ${sectionTitle}`);
  }

  const methods: string[] = [];
  for (const line of lines.slice(startIndex + 1)) {
    const match = /^- `([^`]+)`/.exec(line.trim());
    if (match?.[1]) {
      methods.push(match[1]);
      continue;
    }
    if (methods.length > 0 && line.trim() !== "") break;
  }
  return methods.sort();
}
