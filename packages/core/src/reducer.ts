import type { AgentEvent } from "./events";
import type { AgentSessionState } from "./state";
import { createInitialAgentState } from "./state";
import { reduceAccountEvent } from "./reducer/account";
import { reduceAppsEvent } from "./reducer/apps";
import { reduceConnectionEvent } from "./reducer/connection";
import { reduceDiagnosticsEvent } from "./reducer/diagnostics";
import { reduceHooksEvent } from "./reducer/hooks";
import { reduceItemEvent } from "./reducer/item";
import { reduceModelsEvent } from "./reducer/models";
import { reduceRunSettingsEvent } from "./reducer/run-settings";
import { reduceServerRequestEvent } from "./reducer/server-requests";
import { reduceSkillsEvent } from "./reducer/skills";
import { reduceThreadEvent } from "./reducer/thread";
import { reduceTurnEvent } from "./reducer/turn";
import { reduceUsageEvent } from "./reducer/usage";

export function agentReducer(
  state: AgentSessionState = createInitialAgentState(),
  event: AgentEvent,
): AgentSessionState {
  switch (event.type) {
    case "connection/connecting":
    case "connection/connected":
    case "connection/closed":
    case "connection/error":
      return reduceConnectionEvent(state, event);
    case "account/updated":
    case "account/login/deviceCodeStarted":
    case "account/login/completed":
    case "account/rateLimits/updated":
      return reduceAccountEvent(state, event);
    case "usage/hostMetrics/updated":
      return reduceUsageEvent(state, event);
    case "skills/updated":
      return reduceSkillsEvent(state, event);
    case "apps/updated":
      return reduceAppsEvent(state, event);
    case "hooks/updated":
      return reduceHooksEvent(state, event);
    case "models/updated":
      return reduceModelsEvent(state, event);
    case "runSettings/updated":
      return reduceRunSettingsEvent(state, event);
    case "thread/upserted":
    case "thread/started":
    case "thread/status/changed":
    case "thread/name/updated":
    case "thread/tokenUsage/updated":
    case "thread/active/set":
      return reduceThreadEvent(state, event);
    case "turn/started":
    case "turn/completed":
    case "turn/plan/updated":
    case "turn/diff/updated":
      return reduceTurnEvent(state, event);
    case "item/started":
    case "item/agentMessage/delta":
    case "item/reasoning/summaryTextDelta":
    case "item/commandOutput/delta":
    case "item/filePatch/updated":
    case "item/completed":
      return reduceItemEvent(state, event);
    case "serverRequest/created":
    case "serverRequest/resolved":
    case "serverRequest/rejected":
      return reduceServerRequestEvent(state, event);
    case "status/banner/added":
    case "status/banner/removed":
    case "notification/received":
    case "warning/added":
    case "error/added":
      return reduceDiagnosticsEvent(state, event);
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled event: ${JSON.stringify(value)}`);
}
