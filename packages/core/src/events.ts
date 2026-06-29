import type { AccountEvent } from "./events/account";
import type { AppsEvent } from "./events/apps";
import type { ConnectionEvent } from "./events/connection";
import type { DiagnosticsEvent } from "./events/diagnostics";
import type { HooksEvent } from "./events/hooks";
import type { ItemEvent } from "./events/item";
import type { ModelsEvent } from "./events/models";
import type { RunSettingsEvent } from "./events/run-settings";
import type { ServerRequestEvent } from "./events/server-requests";
import type { SkillsEvent } from "./events/skills";
import type { ThreadEvent } from "./events/thread";
import type { TurnEvent } from "./events/turn";
import type { UsageEvent } from "./events/usage";
import type { AgentError, RequestId } from "./state";
import type { AgentServerRequest } from "./events/server-requests";

export type * from "./events/account";
export type * from "./events/apps";
export type * from "./events/connection";
export type * from "./events/diagnostics";
export type * from "./events/hooks";
export type * from "./events/item";
export type * from "./events/models";
export type * from "./events/run-settings";
export type * from "./events/server-requests";
export type * from "./events/skills";
export type * from "./events/thread";
export type * from "./events/turn";
export type * from "./events/usage";

export type AgentEvent =
  | ConnectionEvent
  | AccountEvent
  | UsageEvent
  | SkillsEvent
  | AppsEvent
  | HooksEvent
  | ModelsEvent
  | RunSettingsEvent
  | ThreadEvent
  | TurnEvent
  | ItemEvent
  | ServerRequestEvent
  | DiagnosticsEvent;

export interface AgentTransportEvent {
  type: "event" | "request" | "response" | "error" | "stderr" | "raw";
  event?: AgentEvent;
  request?: AgentServerRequest;
  requestId?: RequestId;
  payload?: unknown;
  error?: AgentError;
  message?: string;
}
