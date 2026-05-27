import {
  createInitialAgentState,
  FakeAgentTransport,
  runEventFixture,
  type AgentSessionState,
  type AgentTransport,
  type AgentTransportEvent,
  type FakeTransportRequest,
  type FixtureStep,
  type PendingServerRequest,
} from "@nyosegawa/agent-ui-core";
import demoFixture from "../../../../fixtures/app-server/demo-session.json";
import type { DemoScenario } from "./gallery";

export function createDemoInitialState(demoState: DemoScenario): AgentSessionState {
  if (demoState === "default") return runEventFixture(demoFixture as FixtureStep[]);
  if (demoState === "rich-transcript") return createRichTranscriptInitialState();
  const state = createInitialAgentState();
  if (demoState === "unauth") {
    state.account = { status: "unauthenticated" };
    return state;
  }
  if (demoState === "empty") {
    state.account = {
      account: { email: "fixture@example.com", planType: "pro" },
      status: "authenticated",
    };
    state.usage.accountRateLimits = demoRateLimits();
    state.models = { models: demoModels() };
    return state;
  }
  return state;
}

export function createDemoTransport(demoState: DemoScenario): AgentTransport {
  if (demoState === "bridge-error") return new FailingTransport();
  return new FakeAgentTransport({
    onRequest(request) {
      return handleDemoRequest(request, demoState);
    },
  });
}

function handleDemoRequest(request: FakeTransportRequest, demoState: DemoScenario) {
  if (request.method === "account/read") {
    return demoState === "unauth"
      ? {}
      : { account: { email: "fixture@example.com", planType: "pro" } };
  }
  if (request.method === "account/login/start") {
    return {
      loginId: "fixture-login-1",
      userCode: "ABCD-EFGH",
      verificationUrl: "https://chatgpt.com/activate",
    };
  }
  if (request.method === "account/login/cancel") return { status: "cancelled" };
  if (request.method === "model/list") return { data: demoModels() };
  if (request.method === "account/rateLimits/read") return demoRateLimits();
  if (request.method === "thread/start") {
    return {
      thread: {
        id: `thread-local-${request.id}`,
        name: "New local thread",
        path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
      },
    };
  }
  if (request.method === "thread/list") {
    if (demoState === "empty" || demoState === "unauth") return { data: [] };
    return {
      data: [
        {
          id: "thread-history-demo",
          name: "Stored session",
          preview: "Review a stored session",
          status: { type: "notLoaded" },
          turns: [],
        },
      ],
    };
  }
  if (request.method === "thread/read") {
    return {
      thread: {
        id: "thread-history-demo",
        name: "Stored session",
        path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
        status: { type: "notLoaded" },
        turns: [
          {
            id: "turn-history-demo",
            items: [
              {
                content: [{ text: "Show me a stored session.", type: "text" }],
                id: "item-history-user",
                type: "userMessage",
              },
              {
                id: "item-history-agent",
                text: "Stored session history can be read before resuming.",
                type: "agentMessage",
              },
            ],
            status: "completed",
          },
        ],
      },
    };
  }
  if (request.method === "thread/resume") {
    return {
      thread: {
        id: "thread-history-demo",
        name: "Stored session",
        path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
        status: { type: "idle" },
        turns: [],
      },
    };
  }
  return {};
}

export function createRichTranscriptInitialState(): AgentSessionState {
  const state = createInitialAgentState();
  state.account = {
    account: { email: "fixture@example.com", planType: "pro" },
    status: "authenticated",
  };
  state.usage.accountRateLimits = demoRateLimits();
  state.models = { models: demoModels(), selectedModelId: "fixture-demo-model" };
  state.threadRegistry.activeThreadId = "thread-rich-transcript";
  state.threadRegistry.liveThreadIds = ["thread-rich-transcript"];
  state.diagnostics.banners = [
    {
      id: "banner-model-reroute",
      kind: "modelReroute",
      message: "Model rerouted from fixture-heavy-model to fixture-demo-model.",
    },
    {
      id: "banner-deprecation",
      kind: "deprecationNotice",
      message: "A deprecated host field was ignored by the stable adapter.",
    },
    {
      id: "banner-config",
      kind: "configWarning",
      message: "Config warning normalized without leaking raw bridge output.",
    },
    {
      id: "banner-account",
      kind: "accountStatus",
      message: "Account and model metadata are ready.",
    },
    {
      id: "banner-mcp",
      kind: "mcpOAuth",
      message: "MCP OAuth completed for the github app.",
    },
    {
      id: "banner-rate",
      kind: "rateLimit",
      message: "Weekly rate-limit usage is below the warning threshold.",
    },
  ];
  const pendingRequests: Record<string, PendingServerRequest> = {
    "approval-command-rich-transcript": {
      id: "approval-command-rich-transcript",
      kind: "commandApproval",
      payload: {
        command: "bun run test:e2e:playwright",
        cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
        reason: "Verify responsive Codex UI layout.",
      },
      threadId: "thread-rich-transcript",
    },
    "approval-input-rich-transcript": {
      id: "approval-input-rich-transcript",
      kind: "userInput",
      payload: {
        prompt: "Choose the verification target for this thread.",
      },
      threadId: "thread-rich-transcript",
    },
    "approval-tool-rich-transcript": {
      id: "approval-tool-rich-transcript",
      kind: "dynamicTool",
      payload: {
        tool: "browser_verification_snapshot",
        arguments: { url: "http://127.0.0.1:5174/rich-transcript" },
      },
      threadId: "thread-rich-transcript",
    },
  };
  state.serverRequestQueue = {
    byId: pendingRequests,
    order: [
      "approval-command-rich-transcript",
      "approval-input-rich-transcript",
      "approval-tool-rich-transcript",
    ],
  };
  state.threads["thread-rich-transcript"] = {
    orderedTurnIds: ["turn-rich-transcript"],
    registryStatus: "live",
    status: "waitingForInput",
    thread: {
      id: "thread-rich-transcript",
      name: "Rich transcript fixture",
      path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
    },
    tokenUsage: {
      inputTokens: 4200,
      modelContextWindow: 10000,
      outputTokens: 1600,
      totalTokens: 5800,
    },
    turns: {
      "turn-rich-transcript": {
        blocksByItemId: {
          "item-thinking": {
            id: "item-thinking",
            kind: "thinking",
            status: "completed",
            summary: "Reviewing protocol-shaped UI surfaces before rendering.",
          },
          "item-plan": {
            id: "item-plan",
            kind: "plan",
            status: "completed",
            text: "- Normalize state\n- Render rich blocks\n- Verify browser layout",
          },
          "item-command": {
            command: "bun run test:e2e:playwright",
            cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
            durationMs: 8420,
            exitCode: 0,
            id: "item-command",
            kind: "commandExecution",
            output: "9 passed\n",
            status: "completed",
          },
          "item-file": {
            changes: [
              { kind: "update", path: "packages/react/src/timeline.tsx" },
              { kind: "update", path: "docs/testing.md" },
            ],
            id: "item-file",
            kind: "fileChange",
            status: "completed",
            text: "Renderer and verification docs updated.",
          },
          "item-tool": {
            arguments: { interactive: true },
            id: "item-tool",
            kind: "mcpToolCall",
            result: { refs: 42 },
            server: "agent-browser",
            status: "completed",
            tool: "snapshot",
            toolType: "mcp",
          },
          "item-web": {
            id: "item-web",
            kind: "webSearch",
            query: "Codex App Server generated protocol",
            status: "completed",
          },
          "item-image": {
            id: "item-image",
            kind: "image",
            path: "/tmp/agent-ui-rich-transcript-check.png",
            status: "completed",
          },
          "item-system": {
            id: "item-system",
            kind: "systemInfo",
            status: "completed",
            subtype: "compaction",
            text: "Context compaction preserved active transcript state.",
          },
        },
        commandOutputByItemId: {
          "item-command": "9 passed\n",
        },
        filePatchByItemId: {},
        itemOrder: [
          "item-user",
          "item-thinking",
          "item-plan",
          "item-command",
          "item-file",
          "item-tool",
          "item-web",
          "item-image",
          "item-system",
          "item-agent",
        ],
        items: {
          "item-agent": {
            id: "item-agent",
            kind: "agentMessage",
            status: "completed",
            text: "Rich transcript renderers are visible in one deterministic fixture.",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-command": {
            id: "item-command",
            kind: "commandExecution",
            status: "completed",
            text: "bun run test:e2e:playwright",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-file": {
            id: "item-file",
            kind: "fileChange",
            status: "completed",
            text: "Renderer and verification docs updated.",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-image": {
            id: "item-image",
            kind: "imageView",
            status: "completed",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-plan": {
            id: "item-plan",
            kind: "plan",
            status: "completed",
            text: "- Normalize state\n- Render rich blocks\n- Verify browser layout",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-system": {
            id: "item-system",
            kind: "contextCompaction",
            status: "completed",
            text: "Context compaction preserved active transcript state.",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-thinking": {
            id: "item-thinking",
            kind: "reasoning",
            status: "completed",
            text: "Reviewing protocol-shaped UI surfaces before rendering.",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-tool": {
            id: "item-tool",
            kind: "mcpToolCall",
            status: "completed",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-user": {
            id: "item-user",
            kind: "userMessage",
            status: "completed",
            text: "Exercise the rich transcript fixture with approvals, tools, and media.",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
          "item-web": {
            id: "item-web",
            kind: "webSearch",
            status: "completed",
            threadId: "thread-rich-transcript",
            turnId: "turn-rich-transcript",
          },
        },
        streamingTextByItemId: {},
        turn: { id: "turn-rich-transcript", status: "completed", threadId: "thread-rich-transcript" },
      },
    },
  };
  return state;
}

export function demoModels() {
  return [
    {
      defaultReasoningEffort: "medium",
      displayName: "Fixture Model",
      id: "fixture-demo-model",
      supportedReasoningEfforts: ["medium", "high"],
    },
  ];
}

export function demoRateLimits() {
  return {
    rateLimits: {
      limitName: "fixture-demo-model",
      primary: {
        resetsAt: "2026-05-09T12:00:00.000Z",
        usedPercent: 12,
        windowDurationMins: 300,
      },
      secondary: {
        resetsAt: "2026-05-12T12:00:00.000Z",
        usedPercent: 34,
        windowDurationMins: 10080,
      },
    },
  };
}

class FailingTransport implements AgentTransport {
  get events(): AsyncIterable<AgentTransportEvent> {
    return {
      [Symbol.asyncIterator]() {
        return {
          next: () => new Promise<IteratorResult<AgentTransportEvent>>(() => undefined),
        };
      },
    };
  }

  async connect(): Promise<void> {
    throw new Error("Fixture bridge failed before connecting to Codex App Server.");
  }

  async close(): Promise<void> {}

  notify(): void {}

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    void method;
    void params;
    throw new Error("Fixture bridge is not connected.");
  }

  async respond(): Promise<void> {
    throw new Error("Fixture bridge is not connected.");
  }

  async reject(): Promise<void> {
    throw new Error("Fixture bridge is not connected.");
  }
}
