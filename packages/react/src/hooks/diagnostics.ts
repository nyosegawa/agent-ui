import {
  selectDiagnosticErrors,
  selectDiagnosticWarnings,
  selectDiagnostics,
  selectProtocolNotifications,
  selectStatusBanners,
} from "@nyosegawa/agent-ui-core";
import { useAgentContext } from "../provider";

export function useAgentDiagnostics() {
  const { state } = useAgentContext();
  return {
    banners: selectStatusBanners(state),
    diagnostics: selectDiagnostics(state),
    errors: selectDiagnosticErrors(state),
    protocolNotifications: selectProtocolNotifications(state),
    warnings: selectDiagnosticWarnings(state),
  };
}
