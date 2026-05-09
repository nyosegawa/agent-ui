import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin });
let nextRequestId = 10_000;
let nextTurnOrdinal = 1;
const approvalIds = new Set<string>();

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
      return;
    case "thread/start":
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
          id: "thread-live",
          name: "Live real smoke",
          status: { type: "idle" },
        }),
      });
      notify("thread/started", {
        status: { type: "idle" },
        thread: thread({
          id: "thread-live",
          name: "Live real smoke",
          status: { type: "idle" },
        }),
      });
      return;
    case "turn/start": {
      const turnId = `turn-live-${nextTurnOrdinal++}`;
      const prompt = inputText(message.params);
      const requiresApproval = prompt === "run smoke";
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
        responseText: requiresApproval ? "Streaming smoke response." : `Echo: ${prompt}`,
        requiresApproval,
        turnId,
      });
      return;
    }
    default:
      respond(message.id, {});
  }
}

function streamTurn({
  requiresApproval,
  responseText,
  turnId,
}: {
  requiresApproval: boolean;
  responseText: string;
  turnId: string;
}) {
  const agentItemId = `item-${turnId}`;
  const commandItemId = `cmd-${turnId}`;
  const diffItemId = `diff-${turnId}`;
  schedule(0, () =>
    notify("turn/started", {
      threadId: "thread-live",
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
      threadId: "thread-live",
      turnId,
    }),
  );
  schedule(20, () =>
    notify("item/commandExecution/outputDelta", {
      delta: "fake command output\n",
      itemId: commandItemId,
      threadId: "thread-live",
      turnId,
    }),
  );
  schedule(30, () =>
    notify("item/fileChange/patchUpdated", {
      itemId: diffItemId,
      patch: "diff --git a/README.md b/README.md\n+smoke\n",
      threadId: "thread-live",
      turnId,
    }),
  );
  if (!requiresApproval) {
    schedule(40, () =>
      notify("turn/completed", {
        items: [
          {
            id: agentItemId,
            text: responseText,
            type: "agentMessage",
          },
        ],
        threadId: "thread-live",
        turn: {
          completedAt: 1778000003,
          durationMs: 1000,
          error: null,
          id: turnId,
          items: [],
          startedAt: 1778000002,
          status: "completed",
        },
      }),
    );
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
        threadId: "thread-live",
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
