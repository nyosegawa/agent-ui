import type { AgentDiagnosticAudience, AgentError } from "./common";

export interface WarningState {
  audience?: readonly AgentDiagnosticAudience[];
  id: string;
  message: string;
  raw?: unknown;
}

export type StatusBannerKind =
  | "modelReroute"
  | "deprecationNotice"
  | "configWarning"
  | "accountStatus"
  | "mcpOAuth"
  | "rateLimit"
  | "system";

export interface StatusBannerState {
  audience?: readonly AgentDiagnosticAudience[];
  id: string;
  kind: StatusBannerKind;
  message: string;
  raw?: unknown;
  severity?: "info" | "warning" | "critical";
}

export interface DiagnosticsState {
  banners: StatusBannerState[];
  errors: AgentError[];
  protocolNotifications: ProtocolNotificationState[];
  warnings: WarningState[];
}

export interface ProtocolNotificationState {
  audience?: readonly AgentDiagnosticAudience[];
  id: string;
  method: string;
  params?: unknown;
}
