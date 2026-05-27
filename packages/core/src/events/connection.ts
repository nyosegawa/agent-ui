import type { AgentError } from "../state";

export type ConnectionEvent =
  | { type: "connection/connecting" }
  | { type: "connection/connected" }
  | { type: "connection/closed"; reason?: string }
  | { type: "connection/error"; error: AgentError };
