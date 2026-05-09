import type { AgentEvent } from "./events";
import type {
  AgentItemState,
  AgentSessionState,
  AgentThread,
  AgentTurn,
  ThreadId,
  ThreadState,
  TurnState,
} from "./state";
import { createInitialAgentState } from "./state";

export function agentReducer(
  state: AgentSessionState = createInitialAgentState(),
  event: AgentEvent,
): AgentSessionState {
  switch (event.type) {
    case "connection/connecting":
      return { ...state, connection: { status: "connecting" } };
    case "connection/connected":
      return { ...state, connection: { status: "connected" } };
    case "connection/closed":
      return {
        ...state,
        connection: { status: "closed", reason: event.reason },
        pendingServerRequests: {},
      };
    case "connection/error":
      return {
        ...state,
        connection: { status: "error", error: event.error },
        errors: [...state.errors, event.error],
      };
    case "account/updated":
      return {
        ...state,
        account: {
          ...state.account,
          account: event.account as Record<string, unknown> | undefined,
          status:
            event.status ??
            (event.account == null ? "unauthenticated" : "authenticated"),
        },
      };
    case "account/login/deviceCodeStarted":
      return {
        ...state,
        account: {
          ...state.account,
          login: {
            expiresAt: event.expiresAt,
            requestId: event.requestId,
            userCode: event.userCode,
            verificationUrl: event.verificationUrl,
          },
          status: "authenticating",
        },
      };
    case "account/login/completed":
      return {
        ...state,
        account: {
          account: event.account as Record<string, unknown> | undefined,
          status: "authenticated",
        },
      };
    case "account/rateLimits/updated":
      return {
        ...state,
        account: {
          ...state.account,
          rateLimits: event.rateLimits,
        },
      };
    case "models/updated":
      return {
        ...state,
        models: {
          models: event.models,
          selectedModelId: event.selectedModelId ?? state.models.selectedModelId,
        },
        runSettings: {
          ...state.runSettings,
          ...(event.selectedModelId ? { modelId: event.selectedModelId } : {}),
        },
      };
    case "runSettings/updated":
      return {
        ...state,
        models: {
          ...state.models,
          selectedModelId: event.modelId ?? state.models.selectedModelId,
        },
        runSettings: {
          ...state.runSettings,
          ...(event.executionMode ? { executionMode: event.executionMode } : {}),
          ...(event.modelId !== undefined ? { modelId: event.modelId || undefined } : {}),
          ...(event.effort !== undefined ? { effort: event.effort || undefined } : {}),
          ...(event.cwd !== undefined ? { cwd: event.cwd || undefined } : {}),
        },
      };
    case "thread/upserted":
    case "thread/started": {
      const threadState = upsertThread(state, event.thread);
      const turns = { ...threadState.turns };
      const orderedTurnIds = [...threadState.orderedTurnIds];
      for (const turn of event.turns ?? []) {
        if (!orderedTurnIds.includes(turn.id)) orderedTurnIds.push(turn.id);
        turns[turn.id] = turns[turn.id] ?? createTurnState(turn, event.thread.id);
      }
      return {
        ...state,
        activeThreadId: event.type === "thread/started" ? event.thread.id : state.activeThreadId,
        threads: {
          ...state.threads,
          [event.thread.id]: {
            ...threadState,
            orderedTurnIds,
            status: event.status ?? threadState.status,
            turns,
          },
        },
      };
    }
    case "thread/status/changed":
      return updateThread(state, event.threadId, (thread) => ({
        ...thread,
        status: event.status,
      }));
    case "thread/name/updated":
      return updateThread(state, event.threadId, (thread) => ({
        ...thread,
        thread: { ...thread.thread, name: event.name },
      }));
    case "thread/tokenUsage/updated":
      return updateThread(state, event.threadId, (thread) => ({
        ...thread,
        tokenUsage: event.tokenUsage,
      }));
    case "thread/active/set":
      return { ...state, activeThreadId: event.threadId };
    case "turn/started":
      return updateThread(state, event.threadId, (thread) =>
        upsertTurn(thread, event.turn, "running"),
      );
    case "turn/completed":
      return updateThread(state, event.threadId, (thread) => {
        const next = upsertTurn(thread, event.turn, event.turn.status ?? "complete");
        const turn = next.turns[event.turn.id] ?? createTurnState(event.turn, event.threadId);
        const items = { ...turn.items };
        const itemOrder = [...turn.itemOrder];
        for (const item of event.items ?? []) {
          items[item.id] = item;
          if (!itemOrder.includes(item.id)) itemOrder.push(item.id);
        }
        return {
          ...next,
          turns: {
            ...next.turns,
            [event.turn.id]: {
              ...turn,
              itemOrder,
              items,
              turn: event.turn,
            },
          },
        };
      });
    case "turn/plan/updated":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        plan: {
          explanation: event.explanation,
          plan: event.plan,
          raw: event.raw,
        },
      }));
    case "item/started":
      return updateTurn(state, event.threadId, event.turnId, (turn) =>
        upsertItem(turn, event.item),
      );
    case "item/agentMessage/delta":
    case "item/reasoning/summaryTextDelta":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        streamingTextByItemId: appendById(
          turn.streamingTextByItemId,
          event.itemId,
          event.delta,
        ),
      }));
    case "item/commandOutput/delta":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        commandOutputByItemId: appendById(
          turn.commandOutputByItemId,
          event.itemId,
          event.delta,
        ),
      }));
    case "item/filePatch/updated":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        filePatchByItemId: { ...turn.filePatchByItemId, [event.itemId]: event.patch },
      }));
    case "item/completed":
      return updateTurn(state, event.threadId, event.turnId, (turn) =>
        upsertItem(turn, event.item),
      );
    case "serverRequest/created":
      return {
        ...state,
        pendingServerRequests: {
          ...state.pendingServerRequests,
          [String(event.request.id)]: event.request,
        },
      };
    case "serverRequest/resolved": {
      const pendingServerRequests = { ...state.pendingServerRequests };
      delete pendingServerRequests[String(event.requestId)];
      return { ...state, pendingServerRequests };
    }
    case "serverRequest/rejected": {
      const pendingServerRequests = { ...state.pendingServerRequests };
      delete pendingServerRequests[String(event.requestId)];
      return {
        ...state,
        errors: event.error ? [...state.errors, event.error] : state.errors,
        pendingServerRequests,
      };
    }
    case "warning/added":
      return { ...state, configWarnings: [...state.configWarnings, event.warning] };
    case "error/added":
      return { ...state, errors: [...state.errors, event.error] };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled event: ${JSON.stringify(value)}`);
}

function upsertThread(state: AgentSessionState, thread: AgentThread): ThreadState {
  return (
    state.threads[thread.id] ?? {
      orderedTurnIds: [],
      status: "loaded",
      thread,
      turns: {},
    }
  );
}

function updateThread(
  state: AgentSessionState,
  threadId: ThreadId,
  updater: (thread: ThreadState) => ThreadState,
): AgentSessionState {
  const thread = state.threads[threadId];
  if (!thread) return state;
  return {
    ...state,
    threads: {
      ...state.threads,
      [threadId]: updater(thread),
    },
  };
}

function createTurnState(turn: AgentTurn, threadId: ThreadId): TurnState {
  return {
    commandOutputByItemId: {},
    filePatchByItemId: {},
    itemOrder: [],
    items: {},
    streamingTextByItemId: {},
    turn: { ...turn, threadId },
  };
}

function upsertTurn(
  thread: ThreadState,
  turn: AgentTurn,
  threadStatus: ThreadState["status"],
): ThreadState {
  const orderedTurnIds = thread.orderedTurnIds.includes(turn.id)
    ? thread.orderedTurnIds
    : [...thread.orderedTurnIds, turn.id];
  return {
    ...thread,
    orderedTurnIds,
    status: threadStatus,
    turns: {
      ...thread.turns,
      [turn.id]: {
        ...(thread.turns[turn.id] ?? createTurnState(turn, thread.thread.id)),
        turn,
      },
    },
  };
}

function updateTurn(
  state: AgentSessionState,
  threadId: ThreadId,
  turnId: string,
  updater: (turn: TurnState) => TurnState,
): AgentSessionState {
  return updateThread(state, threadId, (thread) => {
    const turn =
      thread.turns[turnId] ??
      createTurnState({ id: turnId, threadId, status: "running" }, threadId);
    return {
      ...thread,
      orderedTurnIds: thread.orderedTurnIds.includes(turnId)
        ? thread.orderedTurnIds
        : [...thread.orderedTurnIds, turnId],
      turns: {
        ...thread.turns,
        [turnId]: updater(turn),
      },
    };
  });
}

function upsertItem(turn: TurnState, item: AgentItemState): TurnState {
  return {
    ...turn,
    itemOrder: turn.itemOrder.includes(item.id) ? turn.itemOrder : [...turn.itemOrder, item.id],
    items: {
      ...turn.items,
      [item.id]: item,
    },
  };
}

function appendById(
  values: Record<string, string>,
  id: string,
  delta: string,
): Record<string, string> {
  return { ...values, [id]: `${values[id] ?? ""}${delta}` };
}
