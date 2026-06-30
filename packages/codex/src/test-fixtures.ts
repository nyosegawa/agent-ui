import type {
  AgentEvent,
  FakeTransportRequest,
} from "@nyosegawa/agent-ui-core";
import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import type { Thread } from "./generated/stable/v2/Thread";
import type { ThreadItem } from "./generated/stable/v2/ThreadItem";
import type { ThreadReadResponse } from "./generated/stable/v2/ThreadReadResponse";
import type { ThreadStartResponse } from "./generated/stable/v2/ThreadStartResponse";
import type { Turn } from "./generated/stable/v2/Turn";
import type { TurnStartResponse } from "./generated/stable/v2/TurnStartResponse";
import { normalizeCodexServerMessage } from "./normalizer";

export interface CodexAppServerSuccessFixtureOptions {
  autoCompleteTurns?: boolean;
  cwd?: string;
  model?: string;
  responseText?: string | ((turn: CodexAppServerFixtureTurn) => string);
}

export interface CodexAppServerFixtureThread {
  cwd: string;
  id: string;
  model: string;
  turns: CodexAppServerFixtureTurn[];
}

export interface CodexAppServerFixtureTurn {
  agentItemId: string;
  inputText: string;
  status: "inProgress" | "completed" | "interrupted";
  steers: string[];
  text: string;
  threadId: string;
  turnId: string;
}

export interface CodexAppServerSuccessFixture {
  readonly events: readonly AgentEvent[];
  readonly requests: readonly FakeTransportRequest[];
  readonly threads: readonly CodexAppServerFixtureThread[];
  readonly transport: FakeAgentTransport;
  activeTurn(threadId?: string): CodexAppServerFixtureTurn | undefined;
  completeTurn(threadId?: string, turnId?: string): CodexAppServerFixtureTurn | undefined;
  reset(): void;
}

export function createCodexAppServerSuccessFixture(
  options: CodexAppServerSuccessFixtureOptions = {},
): CodexAppServerSuccessFixture {
  const state = createFixtureState(options);
  const transport: FakeAgentTransport = new FakeAgentTransport({
    onRequest: (request): unknown => handleRequest(state, request, transport),
  });

  return {
    get events() {
      return state.events;
    },
    get requests() {
      return transport.requests;
    },
    get threads() {
      return state.threads;
    },
    transport,
    activeTurn: (threadId) => activeTurn(state, threadId),
    completeTurn: (threadId, turnId) =>
      completeTurn(state, threadId, turnId, transport),
    reset: () => {
      state.threads = [];
      state.events = [];
      state.threadCounter = 0;
      state.turnCounter = 0;
      transport.notifications.length = 0;
      transport.requests.length = 0;
      transport.rejections.clear();
      transport.responses.clear();
    },
  };
}

interface FixtureState {
  autoCompleteTurns: boolean;
  cwd: string;
  events: AgentEvent[];
  model: string;
  responseText: NonNullable<CodexAppServerSuccessFixtureOptions["responseText"]>;
  threadCounter: number;
  threads: CodexAppServerFixtureThread[];
  turnCounter: number;
}

function createFixtureState(
  options: CodexAppServerSuccessFixtureOptions,
): FixtureState {
  return {
    autoCompleteTurns: options.autoCompleteTurns ?? true,
    cwd: options.cwd ?? "/tmp/agent-ui-fixture",
    events: [],
    model: options.model ?? "gpt-5-fixture",
    responseText:
      options.responseText ?? ((turn) => `Fixture response to: ${turn.inputText}`),
    threadCounter: 0,
    threads: [],
    turnCounter: 0,
  };
}

function handleRequest(
  state: FixtureState,
  request: FakeTransportRequest,
  transport: FakeAgentTransport,
): unknown {
  switch (request.method) {
    case "initialize":
      return { protocolVersion: "2" };
    case "account/read":
      return {
        account: {
          email: "fixture@example.com",
          id: "account-fixture",
          name: "Fixture Account",
        },
        authStatus: "loggedIn",
      };
    case "account/rateLimits/read":
      return { primary: null, secondary: null };
    case "model/list":
      return {
        models: [
          {
            id: state.model,
            name: state.model,
          },
        ],
      };
    case "thread/list":
      return {
        nextCursor: null,
        threads: state.threads.map((thread) => threadSnapshot(thread)),
      };
    case "thread/read":
      return readThread(state, request.params);
    case "thread/resume":
      return { thread: threadSnapshot(findThread(state, request.params), true) };
    case "thread/start":
      return startThread(state, request.params, transport);
    case "turn/start":
      return startTurn(state, request.params, transport);
    case "turn/steer":
      return steerTurn(state, request.params, transport);
    case "turn/interrupt":
      return interruptTurn(state, request.params, transport);
    default:
      return {};
  }
}

function startThread(
  state: FixtureState,
  params: unknown,
  transport: FakeAgentTransport,
): ThreadStartResponse {
  const record = asRecord(params);
  const thread: CodexAppServerFixtureThread = {
    cwd: stringParam(record?.cwd) ?? state.cwd,
    id: `thread-fixture-${++state.threadCounter}`,
    model: stringParam(record?.model) ?? state.model,
    turns: [],
  };
  state.threads.push(thread);
  emit(state, transport, "thread/started", {
    thread: threadSnapshot(thread),
    threadId: thread.id,
  });
  return {
    approvalPolicy: "on-request",
    approvalsReviewer: "user",
    cwd: thread.cwd,
    instructionSources: [],
    model: thread.model,
    modelProvider: "openai",
    reasoningEffort: "medium",
    sandbox: { networkAccess: false, type: "readOnly" },
    serviceTier: null,
    thread: threadSnapshot(thread),
  } satisfies ThreadStartResponse;
}

function startTurn(
  state: FixtureState,
  params: unknown,
  transport: FakeAgentTransport,
): TurnStartResponse {
  const record = asRecord(params);
  const threadId = requireString(record?.threadId, "turn/start requires threadId");
  const thread = threadById(state, threadId);
  const turn: CodexAppServerFixtureTurn = {
    agentItemId: `agent-message-fixture-${state.turnCounter + 1}`,
    inputText: inputText(record?.input),
    status: "inProgress",
    steers: [],
    text: "",
    threadId,
    turnId: `turn-fixture-${++state.turnCounter}`,
  };
  turn.text = responseText(state, turn);
  thread.turns.push(turn);
  const startedTurn = turnSnapshot(turn);

  emit(state, transport, "turn/started", {
    threadId,
    turn: startedTurn,
  });
  emit(state, transport, "item/agentMessage/delta", {
    delta: turn.text,
    itemId: turn.agentItemId,
    threadId,
    turnId: turn.turnId,
  });
  if (state.autoCompleteTurns) completeTurn(state, threadId, turn.turnId, transport);
  return { turn: startedTurn };
}

function steerTurn(
  state: FixtureState,
  params: unknown,
  transport: FakeAgentTransport,
): unknown {
  const record = asRecord(params);
  const threadId = requireString(record?.threadId, "turn/steer requires threadId");
  const expectedTurnId = requireString(
    record?.expectedTurnId,
    "turn/steer requires expectedTurnId",
  );
  const turn = activeTurn(state, threadId);
  if (!turn || turn.turnId !== expectedTurnId) {
    throw new Error(`No running turn for ${threadId}/${expectedTurnId}`);
  }
  const text = inputText(record?.input);
  const delta = `\nFixture steer: ${text}`;
  turn.steers.push(text);
  turn.text += delta;
  emit(state, transport, "item/agentMessage/delta", {
    delta,
    itemId: turn.agentItemId,
    threadId,
    turnId: turn.turnId,
  });
  return { turn: turnSnapshot(turn) };
}

function interruptTurn(
  state: FixtureState,
  params: unknown,
  transport: FakeAgentTransport,
): unknown {
  const record = asRecord(params);
  const threadId = requireString(record?.threadId, "turn/interrupt requires threadId");
  const turnId = requireString(record?.turnId, "turn/interrupt requires turnId");
  const turn = activeTurn(state, threadId);
  if (!turn || turn.turnId !== turnId) {
    throw new Error(`No running turn for ${threadId}/${turnId}`);
  }
  turn.status = "interrupted";
  emitCompleted(state, transport, turn);
  return { turn: turnSnapshot(turn) };
}

function readThread(state: FixtureState, params: unknown): ThreadReadResponse {
  const record = asRecord(params);
  const includeTurns = record?.includeTurns !== false;
  return { thread: threadSnapshot(findThread(state, params), includeTurns) };
}

function completeTurn(
  state: FixtureState,
  threadId = activeTurn(state)?.threadId,
  turnId?: string,
  transport?: FakeAgentTransport,
): CodexAppServerFixtureTurn | undefined {
  if (!threadId) return undefined;
  const runningTurn = activeTurn(state, threadId);
  const turn =
    turnId === undefined || runningTurn?.turnId === turnId ? runningTurn : undefined;
  if (!turn) return undefined;
  turn.status = "completed";
  if (transport) emitCompleted(state, transport, turn);
  return turn;
}

function emitCompleted(
  state: FixtureState,
  transport: FakeAgentTransport,
  turn: CodexAppServerFixtureTurn,
): void {
  emit(state, transport, "turn/completed", {
    items: [
      {
        id: turn.agentItemId,
        text: turn.text,
        threadId: turn.threadId,
        turnId: turn.turnId,
        type: "agentMessage",
      },
    ],
    threadId: turn.threadId,
    turn: turnSnapshot(turn),
  });
}

function activeTurn(
  state: FixtureState,
  threadId?: string,
): CodexAppServerFixtureTurn | undefined {
  const threads =
    threadId === undefined
      ? state.threads
      : state.threads.filter((thread) => thread.id === threadId);
  return threads
    .flatMap((thread) => thread.turns)
    .find((turn) => turn.status === "inProgress");
}

function findThread(state: FixtureState, params: unknown): CodexAppServerFixtureThread {
  const record = asRecord(params);
  return threadById(
    state,
    requireString(record?.threadId, "thread request requires threadId"),
  );
}

function threadById(
  state: FixtureState,
  threadId: string,
): CodexAppServerFixtureThread {
  const thread = state.threads.find((candidate) => candidate.id === threadId);
  if (!thread) throw new Error(`Unknown fixture thread: ${threadId}`);
  return thread;
}

function emit(
  state: FixtureState,
  transport: FakeAgentTransport,
  method: string,
  params: unknown,
): void {
  for (const event of normalizeCodexServerMessage({ method, params })) {
    state.events.push(event);
    transport.push({ event, type: "event" });
  }
}

function threadSnapshot(
  thread: CodexAppServerFixtureThread,
  includeTurns = false,
): Thread {
  const hasRunningTurn = thread.turns.some((turn) => turn.status === "inProgress");
  return {
    agentNickname: null,
    agentRole: null,
    cliVersion: "agent-ui-fixture",
    createdAt: 1_778_000_001,
    cwd: thread.cwd,
    ephemeral: false,
    forkedFromId: null,
    gitInfo: null,
    id: thread.id,
    modelProvider: "openai",
    name: "Fixture Thread",
    parentThreadId: null,
    path: null,
    preview: thread.turns[0]?.inputText ?? "",
    recencyAt: 1_778_000_001 + thread.turns.length,
    sessionId: `session-${thread.id}`,
    source: "appServer",
    status: hasRunningTurn ? { activeFlags: [], type: "active" } : { type: "idle" },
    threadSource: null,
    turns: includeTurns ? thread.turns.map(turnSnapshot) : [],
    updatedAt: 1_778_000_001 + thread.turns.length,
  } satisfies Thread;
}

function turnSnapshot(turn: CodexAppServerFixtureTurn): Turn {
  return {
    completedAt: turn.status === "inProgress" ? null : 1_778_000_002,
    durationMs: turn.status === "inProgress" ? null : 100,
    error: null,
    id: turn.turnId,
    items: turn.status === "inProgress" ? [] : [agentMessageItem(turn)],
    itemsView: "full",
    status: turn.status,
    startedAt: 1_778_000_001,
  } satisfies Turn;
}

function agentMessageItem(turn: CodexAppServerFixtureTurn): ThreadItem {
  return {
    id: turn.agentItemId,
    memoryCitation: null,
    phase: "final_answer",
    text: turn.text,
    type: "agentMessage",
  } satisfies ThreadItem;
}

function responseText(
  state: FixtureState,
  turn: CodexAppServerFixtureTurn,
): string {
  return typeof state.responseText === "function"
    ? state.responseText(turn)
    : state.responseText;
}

function inputText(input: unknown): string {
  if (typeof input === "string") return input;
  if (!Array.isArray(input)) return "";
  return input
    .map((part) => {
      const record = asRecord(part);
      return stringParam(record?.text);
    })
    .filter((text): text is string => Boolean(text))
    .join("\n");
}

function requireString(value: unknown, message: string): string {
  const text = stringParam(value);
  if (!text) throw new Error(message);
  return text;
}

function stringParam(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}
