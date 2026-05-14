import type { AgentTransportEvent } from "@nyosegawa/agent-ui-core";

export interface AgentUiHostEventSink {
  onServerRequest?: (event: AgentTransportEvent) => void;
  onThreadEvent?: (event: AgentTransportEvent) => void;
  onTransportEvent?: (event: AgentTransportEvent) => void;
  onTurnEvent?: (event: AgentTransportEvent) => void;
  onUsageEvent?: (event: AgentTransportEvent) => void;
}

export function emitHostEvent(sink: AgentUiHostEventSink | undefined, event: AgentTransportEvent): void {
  sink?.onTransportEvent?.(event);
  if (event.type === "request") sink?.onServerRequest?.(event);
  if (event.event?.type.startsWith("thread/")) sink?.onThreadEvent?.(event);
  if (event.event?.type.startsWith("turn/")) sink?.onTurnEvent?.(event);
  if (
    event.event?.type === "thread/tokenUsage/updated" ||
    event.event?.type === "account/rateLimits/updated" ||
    event.event?.type === "usage/hostMetrics/updated"
  ) {
    sink?.onUsageEvent?.(event);
  }
}
