import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const lines = createInterface({ input: process.stdin });
const approvalIds = new Set<string>();
const activeTurns = new Map<string, string>();

type StoredThread = {
  readonly createdAt: number;
  readonly cwd: string;
  readonly id: string;
  name: string;
  readonly turns: StoredTurn[];
  updatedAt: number;
};

type StoredTurn = {
  readonly agentText: string;
  readonly completedAt: number;
  readonly id: string;
  readonly prompt: string;
  readonly startedAt: number;
};

type FakeServerState = {
  readonly liveThreads?: StoredThread[];
  readonly nextThreadOrdinal?: number;
  readonly nextTurnOrdinal?: number;
};

const statePath = join(
  tmpdir(),
  `agent-ui-fake-codex-app-server-${process.ppid}.json`,
);
const persistedState = readState();
let nextRequestId = 10_000;
let nextThreadOrdinal = persistedState.nextThreadOrdinal ?? 1;
let nextTurnOrdinal = persistedState.nextTurnOrdinal ?? 1;
const liveThreads = new Map<string, StoredThread>(
  (persistedState.liveThreads ?? []).map((thread) => [thread.id, thread]),
);

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
      respond(message.id, threadListResponse(message.params));
      return;
    case "thread/read":
      respond(message.id, {
        thread: threadSnapshot(stringParam(message.params, "threadId") ?? "thread-stored"),
      });
      return;
    case "thread/resume": {
      const threadId = stringParam(message.params, "threadId") ?? "thread-stored";
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
        thread: threadSnapshot(threadId, { resumed: true }),
      });
      notify("thread/tokenUsage/updated", {
        threadId,
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
    }
    case "thread/start": {
      const threadId = `thread-live-${nextThreadOrdinal++}`;
      const record: StoredThread = {
        createdAt: 1778000100 + nextThreadOrdinal,
        cwd: stringParam(message.params, "cwd") ?? "/tmp/agent-ui",
        id: threadId,
        name: "Live real smoke",
        turns: [],
        updatedAt: 1778000100 + nextThreadOrdinal,
      };
      liveThreads.set(threadId, record);
      saveState();
      respond(message.id, {
        approvalPolicy: "on-request",
        approvalsReviewer: { type: "auto" },
        cwd: record.cwd,
        instructionSources: [],
        model: stringParam(message.params, "model") ?? "smoke-model",
        modelProvider: "openai",
        reasoningEffort: "medium",
        sandbox: { type: "readOnly", networkAccess: false },
        serviceTier: null,
        thread: threadSnapshot(threadId),
      });
      notify("thread/started", {
        status: { type: "idle" },
        thread: threadSnapshot(threadId),
      });
      return;
    }
    case "turn/start": {
      const turnId = `turn-live-${nextTurnOrdinal++}`;
      saveState();
      const prompt = inputText(message.params);
      const localImagePaths = inputLocalImagePaths(message.params);
      const threadId = stringParam(message.params, "threadId") ?? "thread-live";
      const requiresApproval = prompt === "run smoke";
      const delaysFirstDelta = prompt === "slow smoke";
      const streamsWhileRunning = prompt === "streaming smoke";
      const hasLongRunningTurn = delaysFirstDelta || streamsWhileRunning;
      const isMissingMedia = prompt === "missing media smoke";
      updateLiveThreadTitle(threadId, prompt);
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
        completeDelayMs: hasLongRunningTurn ? 30_000 : 40,
        localImagePaths: isMissingMedia
          ? ["/tmp/agent-ui/missing-transcript-image.png"]
          : localImagePaths,
        responseText: requiresApproval
          ? "Streaming smoke response."
          : hasLongRunningTurn
            ? `Echo: ${prompt}\n${Array.from({ length: 80 }, (_, index) => `stream line ${index + 1}`).join("\n")}`
            : `Echo: ${prompt}`,
        requiresApproval,
        threadId,
        turnId,
        firstDeltaDelayMs: delaysFirstDelta ? 30_000 : undefined,
        prompt,
      });
      return;
    }
    case "turn/steer": {
      const threadId = stringParam(message.params, "threadId") ?? "thread-live";
      const expectedTurnId = stringParam(message.params, "expectedTurnId");
      const prompt = inputText(message.params);
      if (/non-steerable/i.test(prompt)) {
        respondError(message.id, "Active turn is not steerable");
        return;
      }
      if (!expectedTurnId || activeTurns.get(threadId) !== expectedTurnId) {
        respondError(message.id, "expected turn mismatch");
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

function threadListResponse(params: Record<string, unknown> | undefined) {
  const cursor = stringParam(params, "cursor");
  const searchTerm = stringParam(params, "searchTerm")?.toLowerCase();
  if (cursor === "page-2") {
    return {
      data: [threadListThread("thread-page-2", "Second page real smoke")],
      nextCursor: null,
    };
  }
  const liveData = Array.from(liveThreads.values())
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .map((record) => threadListThread(record.id, record.name));
  const data = [
    ...liveData,
    threadListThread("thread-stored", "Stored real smoke"),
    threadListThread("thread-search", "Searchable real smoke"),
    threadListThread("thread-page-1", "First page real smoke"),
  ].filter((candidate) =>
    searchTerm
      ? String(candidate.name).toLowerCase().includes(searchTerm) ||
        String(candidate.id).toLowerCase().includes(searchTerm)
      : true,
  );
  return {
    data,
    nextCursor: searchTerm ? null : "page-2",
  };
}

function threadListThread(id: string, name: string) {
  return thread({
    id,
    name,
    status: { type: "notLoaded" },
  });
}

function storedThread(
  id: string,
  options: { resumed?: boolean } = {},
): Record<string, unknown> {
  const name = storedThreadName(id);
  return thread({
    id,
    name,
    status: { type: options.resumed ? "idle" : "notLoaded" },
    turns: [
      {
        completedAt: 1778000001,
        durationMs: 100,
        error: null,
        id: `turn-${id}`,
        items: [
          {
            id: `item-${id}`,
            text: `${name} hydrated.`,
            type: "agentMessage",
          },
        ],
        startedAt: 1778000000,
        status: "completed",
      },
    ],
  });
}

function threadSnapshot(
  id: string,
  options: { resumed?: boolean } = {},
): Record<string, unknown> {
  const liveThread = liveThreads.get(id);
  if (!liveThread) return storedThread(id, options);
  return thread({
    createdAt: liveThread.createdAt,
    cwd: liveThread.cwd,
    id,
    name: liveThread.name,
    preview: liveThread.name,
    status: { type: options.resumed ? "idle" : "notLoaded" },
    turns: liveThread.turns.map((turn) => ({
      completedAt: turn.completedAt,
      durationMs: turn.completedAt - turn.startedAt,
      error: null,
      id: turn.id,
      items: [
        {
          content: [{ text: turn.prompt, type: "text" }],
          id: `user-${turn.id}`,
          type: "userMessage",
        },
        {
          id: `item-${turn.id}`,
          text: turn.agentText,
          type: "agentMessage",
        },
      ],
      startedAt: turn.startedAt,
      status: "completed",
    })),
    updatedAt: liveThread.updatedAt,
  });
}

function storedThreadName(id: string): string {
  if (id === "thread-search") return "Searchable real smoke";
  if (id === "thread-page-1") return "First page real smoke";
  if (id === "thread-page-2") return "Second page real smoke";
  return "Stored real smoke";
}

function streamTurn({
  completeDelayMs = 40,
  firstDeltaDelayMs,
  localImagePaths = [],
  prompt,
  requiresApproval,
  responseText,
  threadId,
  turnId,
}: {
  completeDelayMs?: number;
  firstDeltaDelayMs?: number;
  localImagePaths?: string[];
  prompt: string;
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
  schedule(firstDeltaDelayMs ?? 10, () =>
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
      recordLiveTurn({
        agentText: responseText,
        completedAt: 1778000003,
        prompt,
        threadId,
        turnId,
      });
      notify("turn/completed", {
        items: [
          {
            id: agentItemId,
            text: responseText,
            type: "agentMessage",
          },
          ...localImagePaths.map((path, index) => ({
            id: `image-${turnId}-${index}`,
            path,
            type: "imageView",
          })),
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

function updateLiveThreadTitle(threadId: string, prompt: string) {
  const record = liveThreads.get(threadId);
  if (!record || record.turns.length > 0) return;
  const name = titleFromPrompt(prompt);
  if (!name || record.name === name) return;
  record.name = name;
  record.updatedAt += 1;
  saveState();
  schedule(5, () =>
    notify("thread/name/updated", {
      name,
      threadId,
    }),
  );
}

function recordLiveTurn({
  agentText,
  completedAt,
  prompt,
  threadId,
  turnId,
}: {
  agentText: string;
  completedAt: number;
  prompt: string;
  threadId: string;
  turnId: string;
}) {
  const record = liveThreads.get(threadId);
  if (!record || record.turns.some((turn) => turn.id === turnId)) return;
  record.turns.push({
    agentText,
    completedAt,
    id: turnId,
    prompt,
    startedAt: 1778000002,
  });
  record.updatedAt += 1;
  saveState();
}

function titleFromPrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").slice(0, 48) || "Live real smoke";
}

function readState(): FakeServerState {
  if (!existsSync(statePath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(statePath, "utf8"));
    return isFakeServerState(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveState() {
  const state: FakeServerState = {
    liveThreads: Array.from(liveThreads.values()),
    nextThreadOrdinal,
    nextTurnOrdinal,
  };
  writeFileSync(statePath, JSON.stringify(state), "utf8");
}

function isFakeServerState(value: unknown): value is FakeServerState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as FakeServerState;
  return (
    (state.nextThreadOrdinal === undefined ||
      typeof state.nextThreadOrdinal === "number") &&
    (state.nextTurnOrdinal === undefined ||
      typeof state.nextTurnOrdinal === "number") &&
    (state.liveThreads === undefined || Array.isArray(state.liveThreads))
  );
}

function inputLocalImagePaths(params: Record<string, unknown> | undefined): string[] {
  const input = params?.input;
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "localImage" &&
        "path" in item &&
        typeof item.path === "string"
      ) {
        return item.path;
      }
      return undefined;
    })
    .filter((path): path is string => Boolean(path));
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

function respondError(id: string | number | undefined, message: string) {
  if (id == null) return;
  write({ error: { code: -32000, message }, id });
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
