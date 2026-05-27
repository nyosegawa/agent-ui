import type { DiagnosticsEvent } from "../events";
import type { AgentSessionState } from "../state";
import { AGENT_RETENTION_POLICY, boundedAppend } from "../retention";
import { upsertById } from "./shared";

export function reduceDiagnosticsEvent(
  state: AgentSessionState,
  event: DiagnosticsEvent,
): AgentSessionState {
  switch (event.type) {
    case "status/banner/added":
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          banners: upsertById(state.diagnostics.banners, event.banner).slice(
            -AGENT_RETENTION_POLICY.statusBannersMax,
          ),
        },
      };
    case "status/banner/removed":
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          banners: state.diagnostics.banners.filter((banner) => banner.id !== event.id),
        },
      };
    case "notification/received":
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          protocolNotifications: boundedAppend(
            state.diagnostics.protocolNotifications,
            event.notification,
            AGENT_RETENTION_POLICY.protocolNotificationsMax,
          ),
        },
      };
    case "warning/added":
      return {
        ...state,
        configWarnings: boundedAppend(
          state.configWarnings,
          event.warning,
          AGENT_RETENTION_POLICY.warningsMax,
        ),
        diagnostics: {
          ...state.diagnostics,
          warnings: boundedAppend(
            state.diagnostics.warnings,
            event.warning,
            AGENT_RETENTION_POLICY.warningsMax,
          ),
        },
      };
    case "error/added":
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          errors: boundedAppend(
            state.diagnostics.errors,
            event.error,
            AGENT_RETENTION_POLICY.diagnosticsErrorsMax,
          ),
        },
        errors: boundedAppend(state.errors, event.error, AGENT_RETENTION_POLICY.diagnosticsErrorsMax),
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled diagnostics event: ${JSON.stringify(value)}`);
}
