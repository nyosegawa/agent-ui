import type { AgentTransportEvent } from "./events";
import type { AgentError, RequestId } from "./state";

export interface AgentTransport {
  readonly events: AsyncIterable<AgentTransportEvent>;
  close(): Promise<void>;
  connect(): Promise<void>;
  notify(method: string, params?: unknown): void;
  reject(requestId: RequestId, error: AgentError): Promise<void>;
  request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult>;
  respond(requestId: RequestId, result: unknown): Promise<void>;
}
