import type { AgentTurn, ThreadId, TurnId } from "../state";
import type { AgentEventItem } from "./item";

export type TurnEvent =
  | { type: "turn/started"; threadId: ThreadId; turn: AgentTurn }
  | {
      type: "turn/completed";
      threadId: ThreadId;
      turn: AgentTurn;
      items?: AgentEventItem[];
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
