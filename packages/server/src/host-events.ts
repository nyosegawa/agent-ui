import type {
  AgentDiagnosticAudience,
  AgentTransportEvent,
} from "@nyosegawa/agent-ui-core";
import type { DynamicToolDebugEvent } from "./dynamic-tools";

export type AgentUiBridgeHealthPhase =
  | "admissionChecked"
  | "rejected"
  | "processSpawned"
  | "initialized"
  | "connected"
  | "idleClosed"
  | "backpressureClosed"
  | "pendingRequestCount"
  | "diagnostic";

export interface AgentUiBridgeHealthState {
  admissionChecked: boolean;
  connected: boolean;
  initialized: boolean;
  lastRedactedDiagnostic?: string;
  pendingRequestCount: number;
  processSpawned: boolean;
}

export interface AgentUiBridgeHealthEvent {
  audience: readonly AgentDiagnosticAudience[];
  closeCode?: number;
  closeReason?: string;
  diagnostic?: string;
  phase: AgentUiBridgeHealthPhase;
  reasonCode?: string;
  state: AgentUiBridgeHealthState;
  timestamp: number;
  type: "bridgeHealth";
}

export interface AgentUiHostEventSink {
  onBridgeHealthEvent?: (event: AgentUiBridgeHealthEvent) => void;
  onDynamicToolEvent?: (event: DynamicToolDebugEvent) => void;
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
