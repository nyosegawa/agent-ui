import type { AgentError } from "./common";

export type ConnectionState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "connected" }
  | { status: "closed"; reason?: string }
  | { status: "error"; error: AgentError };
