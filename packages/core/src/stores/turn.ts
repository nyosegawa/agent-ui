import type {
  AgentSessionState,
  AgentTurn,
  ThreadId,
  ThreadState,
  TurnId,
  TurnState,
} from "../state";
import { threadEntityStore } from "./thread-entity";
import { mergeAgentTurn } from "./turn-merge";
import { mergeOrderedTurnIds } from "./turn-order";

export interface TurnStore {
  createTurnState(turn: AgentTurn, threadId: ThreadId): TurnState;
  upsert(
    thread: ThreadState,
    turn: AgentTurn,
    threadStatus: ThreadState["status"],
  ): ThreadState;
  update(
    state: AgentSessionState,
    threadId: ThreadId,
    turnId: TurnId,
    updater: (turn: TurnState) => TurnState,
  ): AgentSessionState;
}

export const turnStore: TurnStore = {
  createTurnState,
  update: updateTurn,
  upsert: upsertTurn,
};

export function createTurnState(turn: AgentTurn, threadId: ThreadId): TurnState {
  return {
    blocksByItemId: {},
    commandOutputByItemId: {},
    filePatchByItemId: {},
    itemOrder: [],
    items: {},
    streamingTextByItemId: {},
    turn: { ...turn, threadId },
  };
}

export function upsertTurn(
  thread: ThreadState,
  turn: AgentTurn,
  threadStatus: ThreadState["status"],
): ThreadState {
  const existingTurn = thread.turns[turn.id];
  const canonicalTurn = { ...turn, threadId: thread.thread.id };
  const orderedTurnIds = mergeOrderedTurnIds(thread.orderedTurnIds, [turn.id]);
  return {
    ...thread,
    orderedTurnIds,
    status: threadStatus,
    turns: {
      ...thread.turns,
      [turn.id]: {
        ...(existingTurn ?? createTurnState(canonicalTurn, thread.thread.id)),
        turn: existingTurn
          ? mergeAgentTurn(existingTurn.turn, canonicalTurn)
          : canonicalTurn,
      },
    },
  };
}

export function updateTurn(
  state: AgentSessionState,
  threadId: ThreadId,
  turnId: TurnId,
  updater: (turn: TurnState) => TurnState,
): AgentSessionState {
  return threadEntityStore.update(state, threadId, (thread) => {
    const canonicalThreadId = thread.thread.id;
    const turn =
      thread.turns[turnId] ??
      createTurnState(
        { id: turnId, threadId: canonicalThreadId, status: "running" },
        canonicalThreadId,
      );
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
