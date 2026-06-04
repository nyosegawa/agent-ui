export type RequestId = string | number;
export type ThreadId = string;
export type TurnId = string;
export type ItemId = string;

export interface AgentError {
  audience?: readonly AgentDiagnosticAudience[];
  code?: number;
  message: string;
  data?: unknown;
}

export type AgentDiagnosticAudience = "user" | "developer" | "audit";
