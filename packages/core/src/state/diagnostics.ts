import type { AgentError } from "./common";

export interface WarningState {
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
  id: string;
  method: string;
  params?: unknown;
}
