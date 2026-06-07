import type { AgentDiagnosticAudience, AgentError, ThreadId } from "./common";

export type AgentThreadResumeDiagnosticReasonCode =
  | "canonical_thread_id_mismatch"
  | "resume_response_missing_thread_id"
  | "resume_response_normalization_failed";

export type AgentDiagnosticReasonCode = AgentThreadResumeDiagnosticReasonCode;

export interface WarningState {
  audience?: readonly AgentDiagnosticAudience[];
  id: string;
  message: string;
  raw?: unknown;
  reasonCode?: AgentDiagnosticReasonCode;
  requestedThreadId?: ThreadId;
  threadId?: ThreadId;
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
