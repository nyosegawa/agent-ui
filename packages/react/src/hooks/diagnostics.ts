import {
  selectDiagnosticErrors,
  selectDiagnosticWarnings,
  selectAuditDiagnostics,
  selectDeveloperDiagnostics,
  selectDiagnostics,
  selectProtocolNotifications,
  selectStatusBanners,
  selectUserDiagnostics,
} from "@nyosegawa/agent-ui-core/internal";
import { useInternalAgentContext } from "../provider";

export function useAgentDiagnostics() {
  const { state } = useInternalAgentContext();
  return {
    auditDiagnostics: selectAuditDiagnostics(state),
    banners: selectStatusBanners(state),
    developerDiagnostics: selectDeveloperDiagnostics(state),
    diagnostics: selectDiagnostics(state),
    errors: selectDiagnosticErrors(state),
    protocolNotifications: selectProtocolNotifications(state),
    userDiagnostics: selectUserDiagnostics(state),
    warnings: selectDiagnosticWarnings(state),
  };
}
