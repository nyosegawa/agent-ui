export type RequestId = string | number;
export type ThreadId = string;
export type TurnId = string;
export type ItemId = string;

export interface AgentError {
  code?: number;
  message: string;
  data?: unknown;
}
