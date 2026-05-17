import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin });
let nextRequestId = 10_000;
let nextThreadOrdinal = 1;
let nextTurnOrdinal = 1;
const approvalIds = new Set<string>();
const activeTurns = new Map<string, string>();

lines.on("line", (line) => {
  const message = JSON.parse(line) as JsonRpcLine;
  if (message.method) handleRequest(message);
  if (message.id != null && !message.method && approvalIds.has(String(message.id))) {
    notify("serverRequest/resolved", {
      requestId: message.id,
      threadId: "thread-live",
    });
  }
});

type JsonRpcLine = {
  id?: string | number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
};

function handleRequest(message: JsonRpcLine) {
  switch (message.method) {
    case "initialize":
      respond(message.id, { userAgent: "fake-codex-app-server" });
      return;
    case "initialized":
      return;
    case "account/read":
      respond(message.id, {
        account: { email: "real-smoke@example.com", planType: "pro" },
      });
      return;
    case "model/list":
      respond(message.id, {
        data: [
          {
            defaultReasoningEffort: "medium",
            displayName: "Smoke Model",
            id: "smoke-model",
            isDefault: true,
            supportedReasoningEfforts: [{ reasoningEffort: "medium" }],
          },
        ],
      });
      return;
    case "account/rateLimits/read":
      respond(message.id, {
        rateLimits: {
          limitId: "codex",
          primary: { resetsAt: 1778275493, usedPercent: 12, windowDurationMins: 300 },
          secondary: { resetsAt: 1778563862, usedPercent: 34, windowDurationMins: 10080 },
        },
      });
      return;
    case "thread/list":
      respond(message.id, {
        data: [
          thread({
            id: "thread-stored",
            name: "Stored real smoke",
            status: { type: "notLoaded" },
          }),
        ],
        nextCursor: null,
      });
      return;
    case "thread/read":
      respond(message.id, {
        thread: thread({
          id: "thread-stored",
          name: "Stored real smoke",
          status: { type: "notLoaded" },
          turns: [
            {
              completedAt: 1778000001,
              durationMs: 100,
              error: null,
              id: "turn-stored",
              items: [
                {
                  id: "item-stored",
                  text: "Stored thread hydrated.",
                  type: "agentMessage",
                },
              ],
              startedAt: 1778000000,
              status: "completed",
            },
          ],
        }),
      });
      return;
    case "thread/resume":
      respond(message.id, {
        approvalPolicy: "on-request",
        approvalsReviewer: { type: "auto" },
        cwd: "/tmp/agent-ui",
        instructionSources: [],
        model: "smoke-model",
        modelProvider: "openai",
        reasoningEffort: "medium",
        sandbox: { type: "readOnly", networkAccess: false },
        serviceTier: null,
        thread: thread({
          id: stringParam(message.params, "threadId") ?? "thread-stored",
          name: "Stored real smoke",
          status: { type: "idle" },
        }),
      });
      notify("thread/tokenUsage/updated", {
        threadId: stringParam(message.params, "threadId") ?? "thread-stored",
        tokenUsage: {
          last: {
            cachedInputTokens: 25,
            inputTokens: 500,
            outputTokens: 100,
            reasoningOutputTokens: 50,
            totalTokens: 600,
          },
          modelContextWindow: 1000,
          total: {
            cachedInputTokens: 100,
            inputTokens: 700,
            outputTokens: 90,
            reasoningOutputTokens: 10,
            totalTokens: 800,
          },
        },
        turnId: "turn-stored",
      });
      return;
    case "thread/start": {
      const threadId = `thread-live-${nextThreadOrdinal++}`;
      respond(message.id, {
        approvalPolicy: "on-request",
        approvalsReviewer: { type: "auto" },
        cwd: stringParam(message.params, "cwd") ?? "/tmp/agent-ui",
        instructionSources: [],
        model: stringParam(message.params, "model") ?? "smoke-model",
        modelProvider: "openai",
        reasoningEffort: "medium",
        sandbox: { type: "readOnly", networkAccess: false },
        serviceTier: null,
        thread: thread({
          id: threadId,
          name: "Live real smoke",
          status: { type: "idle" },
        }),
      });
      notify("thread/started", {
        status: { type: "idle" },
        thread: thread({
          id: threadId,
          name: "Live real smoke",
          status: { type: "idle" },
        }),
      });
      return;
    }
    case "turn/start": {
      const turnId = `turn-live-${nextTurnOrdinal++}`;
      const prompt = inputText(message.params);
      const threadId = stringParam(message.params, "threadId") ?? "thread-live";
      const requiresApproval = prompt === "run smoke";
      const isSlow = prompt === "slow smoke";
      respond(message.id, {
        turn: {
          completedAt: null,
          durationMs: null,
          error: null,
          id: turnId,
          items: [],
          startedAt: 1778000002,
          status: "running",
        },
      });
      streamTurn({
        completeDelayMs: isSlow ? 30_000 : 40,
        responseText: requiresApproval
          ? "Streaming smoke response."
          : isSlow
            ? `Echo: ${prompt}\n${Array.from({ length: 80 }, (_, index) => `stream line ${index + 1}`).join("\n")}`
            : `Echo: ${prompt}`,
        requiresApproval,
        threadId,
        turnId,
      });
      return;
    }
    case "turn/steer": {
      const threadId = stringParam(message.params, "threadId") ?? "thread-live";
      const expectedTurnId = stringParam(message.params, "expectedTurnId");
      if (!expectedTurnId || activeTurns.get(threadId) !== expectedTurnId) {
        respond(message.id, { error: "expected turn mismatch" });
        return;
      }
      respond(message.id, { turnId: expectedTurnId });
      notify("item/agentMessage/delta", {
        delta: `\nSteered: ${inputText(message.params)}`,
        itemId: `item-${expectedTurnId}`,
        threadId,
        turnId: expectedTurnId,
      });
      return;
    }
    case "turn/interrupt": {
      const threadId = stringParam(message.params, "threadId") ?? "thread-live";
      const turnId = stringParam(message.params, "turnId") ?? "";
      activeTurns.delete(threadId);
      schedule(20, () => {
        notify("turn/completed", {
          items: [],
          threadId,
          turn: {
            completedAt: 1778000004,
            durationMs: 100,
            error: null,
            id: turnId,
            items: [],
            startedAt: 1778000002,
            status: "interrupted",
          },
        });
        respond(message.id, {});
      });
      return;
    }
    default:
      respond(message.id, {});
  }
}

function streamTurn({
  completeDelayMs = 40,
  requiresApproval,
  responseText,
  threadId,
  turnId,
}: {
  completeDelayMs?: number;
  requiresApproval: boolean;
  responseText: string;
  threadId: string;
  turnId: string;
}) {
  const agentItemId = `item-${turnId}`;
  const commandItemId = `cmd-${turnId}`;
  const diffItemId = `diff-${turnId}`;
  activeTurns.set(threadId, turnId);
  schedule(0, () =>
    notify("turn/started", {
      threadId,
      turn: {
        completedAt: null,
        durationMs: null,
        error: null,
        id: turnId,
        items: [],
        startedAt: 1778000002,
        status: "running",
      },
    }),
  );
  schedule(10, () =>
    notify("item/agentMessage/delta", {
      delta: responseText,
      itemId: agentItemId,
      threadId,
      turnId,
    }),
  );
  schedule(20, () =>
    notify("item/commandExecution/outputDelta", {
      delta: "fake command output\n",
      itemId: commandItemId,
      threadId,
      turnId,
    }),
  );
  schedule(30, () =>
    notify("item/fileChange/patchUpdated", {
      itemId: diffItemId,
      patch: "diff --git a/README.md b/README.md\n+smoke\n",
      threadId,
      turnId,
    }),
  );
  if (!requiresApproval) {
    schedule(completeDelayMs, () => {
      if (activeTurns.get(threadId) !== turnId) return;
      activeTurns.delete(threadId);
      notify("turn/completed", {
        items: [
          {
            id: agentItemId,
            text: responseText,
            type: "agentMessage",
          },
        ],
        threadId,
        turn: {
          completedAt: 1778000003,
          durationMs: 1000,
          error: null,
          id: turnId,
          items: [],
          startedAt: 1778000002,
          status: "completed",
        },
      });
    });
    return;
  }
  schedule(40, () => {
    const approvalId = `approval-${nextRequestId++}`;
    approvalIds.add(approvalId);
    write({
      id: approvalId,
      method: "item/commandExecution/requestApproval",
      params: {
        command: "echo smoke",
        cwd: "/tmp/agent-ui",
        itemId: commandItemId,
        threadId,
        turnId,
      },
    });
  });
}

function thread(overrides: Record<string, unknown>) {
  return {
    agentNickname: null,
    agentRole: null,
    cliVersion: "fake",
    createdAt: 1778000000,
    cwd: "/tmp/agent-ui",
    ephemeral: false,
    forkedFromId: null,
    gitInfo: null,
    id: "thread-live",
    modelProvider: "openai",
    name: "Live real smoke",
    path: null,
    preview: "Live real smoke",
    source: { type: "appServer" },
    status: { type: "idle" },
    turns: [],
    updatedAt: 1778000001,
    ...overrides,
  };
}

function notify(method: string, params: unknown) {
  write({ method, params });
}

function respond(id: string | number | undefined, result: unknown) {
  if (id == null) return;
  write({ id, result });
}

function write(message: unknown) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function schedule(delayMs: number, callback: () => void) {
  setTimeout(callback, delayMs);
}

function stringParam(
  params: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = params?.[key];
  return typeof value === "string" ? value : undefined;
}

function inputText(params: Record<string, unknown> | undefined): string {
  const input = params?.input;
  if (!Array.isArray(input)) return "";
  return input
    .map((item) => {
      if (typeof item === "string") return item;
      if (
        typeof item === "object" &&
        item !== null &&
        "text" in item &&
        typeof item.text === "string"
      ) {
        return item.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}
