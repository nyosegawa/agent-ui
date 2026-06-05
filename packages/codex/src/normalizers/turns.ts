import type { AgentEvent } from "@nyosegawa/agent-ui-core";
import { normalizeItem, normalizeTurn, stringValue } from "./shared";

export function normalizeTurnNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
    case "turn/started":
      return [
        {
          type: "turn/started",
          threadId: String(params.threadId ?? params.thread_id),
          turn: normalizeTurn(
            params.turn ?? params,
            String(params.threadId ?? params.thread_id),
          ),
        },
      ];
    case "turn/completed":
      return [
        {
          type: "turn/completed",
          items: Array.isArray(params.items)
            ? params.items.map((item) => normalizeItem(item, params, "completed"))
            : undefined,
          threadId: String(params.threadId ?? params.thread_id),
          turn: normalizeTurn(
            params.turn ?? params,
            String(params.threadId ?? params.thread_id),
          ),
        },
      ];
    case "turn/plan/updated":
      return [
        {
          explanation: stringValue(params.explanation) ?? null,
          plan: params.plan ?? [],
          threadId: String(params.threadId ?? params.thread_id),
          turnId: String(params.turnId ?? params.turn_id),
          type: "turn/plan/updated",
        },
      ];
    default:
      return undefined;
  }
}
