import type { DiagnosticsEvent } from "../events";
import type { AgentSessionState } from "../state";
import { diagnosticsStore } from "../stores/diagnostics";

export function reduceDiagnosticsEvent(
  state: AgentSessionState,
  event: DiagnosticsEvent,
): AgentSessionState {
  switch (event.type) {
    case "status/banner/added":
    case "status/banner/removed":
    case "notification/received":
    case "warning/added":
    case "error/added":
      return {
        ...state,
        diagnostics: diagnosticsStore.reduce(state.diagnostics, event),
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled diagnostics event: ${JSON.stringify(value)}`);
}
