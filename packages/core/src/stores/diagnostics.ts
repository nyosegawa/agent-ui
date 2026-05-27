import type { DiagnosticsEvent } from "../events";
import type {
  AgentError,
  DiagnosticsState,
  ProtocolNotificationState,
  StatusBannerState,
  WarningState,
} from "../state";
import { AGENT_RETENTION_POLICY, boundedAppend } from "../retention";

export interface DiagnosticsStore {
  addError(state: DiagnosticsState, error: AgentError): DiagnosticsState;
  addWarning(state: DiagnosticsState, warning: WarningState): DiagnosticsState;
  createInitialState(): DiagnosticsState;
  recordNotification(
    state: DiagnosticsState,
    notification: ProtocolNotificationState,
  ): DiagnosticsState;
  reduce(state: DiagnosticsState, event: DiagnosticsEvent): DiagnosticsState;
  removeBanner(state: DiagnosticsState, id: string): DiagnosticsState;
  upsertBanner(state: DiagnosticsState, banner: StatusBannerState): DiagnosticsState;
}

export const diagnosticsStore: DiagnosticsStore = {
  addError: addDiagnosticError,
  addWarning: addDiagnosticWarning,
  createInitialState: createInitialDiagnosticsState,
  recordNotification: recordProtocolNotification,
  reduce: reduceDiagnosticsState,
  removeBanner: removeStatusBanner,
  upsertBanner: upsertStatusBanner,
};

export function createInitialDiagnosticsState(): DiagnosticsState {
  return { banners: [], errors: [], protocolNotifications: [], warnings: [] };
}

export function reduceDiagnosticsState(
  state: DiagnosticsState,
  event: DiagnosticsEvent,
): DiagnosticsState {
  switch (event.type) {
    case "status/banner/added":
      return upsertStatusBanner(state, event.banner);
    case "status/banner/removed":
      return removeStatusBanner(state, event.id);
    case "notification/received":
      return recordProtocolNotification(state, event.notification);
    case "warning/added":
      return addDiagnosticWarning(state, event.warning);
    case "error/added":
      return addDiagnosticError(state, event.error);
    default:
      return state;
  }
}

export function upsertStatusBanner(
  state: DiagnosticsState,
  banner: StatusBannerState,
): DiagnosticsState {
  return {
    ...state,
    banners: upsertById(state.banners, banner).slice(
      -AGENT_RETENTION_POLICY.statusBannersMax,
    ),
  };
}

export function removeStatusBanner(
  state: DiagnosticsState,
  id: string,
): DiagnosticsState {
  return {
    ...state,
    banners: state.banners.filter((banner) => banner.id !== id),
  };
}

export function recordProtocolNotification(
  state: DiagnosticsState,
  notification: ProtocolNotificationState,
): DiagnosticsState {
  return {
    ...state,
    protocolNotifications: boundedAppend(
      state.protocolNotifications,
      notification,
      AGENT_RETENTION_POLICY.protocolNotificationsMax,
    ),
  };
}

export function addDiagnosticWarning(
  state: DiagnosticsState,
  warning: WarningState,
): DiagnosticsState {
  return {
    ...state,
    warnings: boundedAppend(
      state.warnings,
      warning,
      AGENT_RETENTION_POLICY.warningsMax,
    ),
  };
}

export function addDiagnosticError(
  state: DiagnosticsState,
  error: AgentError,
): DiagnosticsState {
  return {
    ...state,
    errors: boundedAppend(
      state.errors,
      error,
      AGENT_RETENTION_POLICY.diagnosticsErrorsMax,
    ),
  };
}

function upsertById<T extends { id: string }>(values: T[], value: T): T[] {
  const index = values.findIndex((current) => current.id === value.id);
  if (index === -1) return [...values, value];
  const next = [...values];
  next[index] = value;
  return next;
}
