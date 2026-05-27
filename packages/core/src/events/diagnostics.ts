import type { AgentError, ProtocolNotificationState, StatusBannerState, WarningState } from "../state";

export type DiagnosticsEvent =
  | { type: "status/banner/added"; banner: StatusBannerState }
  | { type: "status/banner/removed"; id: string }
  | { type: "notification/received"; notification: ProtocolNotificationState }
  | { type: "warning/added"; warning: WarningState }
  | { type: "error/added"; error: AgentError };
