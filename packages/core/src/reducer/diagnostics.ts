import type { DiagnosticsEvent } from "../events";
import type { AgentSessionState } from "../state";
import { AGENT_RETENTION_POLICY, boundedAppend } from "../retention";
import { diagnosticsStore } from "../stores/diagnostics";

export function reduceDiagnosticsEvent(
  state: AgentSessionState,
  event: DiagnosticsEvent,
): AgentSessionState {
  switch (event.type) {
    case "status/banner/added":
    case "status/banner/removed":
    case "notification/received":
      return {
        ...state,
        diagnostics: diagnosticsStore.reduce(state.diagnostics, event),
      };
    case "warning/added":
      return {
        ...state,
        configWarnings: boundedAppend(
          state.configWarnings,
          event.warning,
          AGENT_RETENTION_POLICY.warningsMax,
        ),
        diagnostics: diagnosticsStore.reduce(state.diagnostics, event),
      };
    case "error/added":
      return {
        ...state,
        diagnostics: diagnosticsStore.reduce(state.diagnostics, event),
        errors: boundedAppend(state.errors, event.error, AGENT_RETENTION_POLICY.diagnosticsErrorsMax),
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled diagnostics event: ${JSON.stringify(value)}`);
}
