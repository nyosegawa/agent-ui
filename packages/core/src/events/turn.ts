import type { AgentItemState, AgentTurn, ThreadId, TurnId } from "../state";

export type TurnEvent =
  | { type: "turn/started"; threadId: ThreadId; turn: AgentTurn }
  | {
      type: "turn/completed";
      threadId: ThreadId;
      turn: AgentTurn;
      items?: AgentItemState[];
      snapshot?: boolean;
    }
  | {
      type: "turn/plan/updated";
      threadId: ThreadId;
      turnId: TurnId;
      explanation?: string | null;
      plan: unknown;
    }
  | { type: "turn/diff/updated"; threadId: ThreadId; turnId: TurnId; diff: unknown };
