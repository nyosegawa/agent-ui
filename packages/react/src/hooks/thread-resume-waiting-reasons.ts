import type { AgentEvent } from "@nyosegawa/agent-ui-core/internal";
import type {
  AgentThreadRuntimeStatus,
  AgentThreadWaitingReason,
  ThreadId,
} from "@nyosegawa/agent-ui-core";

export function waitingReasonsFromResumeEvents(
  events: readonly AgentEvent[],
  threadId: ThreadId,
): AgentThreadWaitingReason[] {
  const reasons: AgentThreadWaitingReason[] = [];
  let sawWaitingStatus = false;
  for (const event of events) {
    if (event.type === "serverRequest/created" && event.request.threadId === threadId) {
      if (event.request.kind === "dynamicTool") continue;
      pushUnique(reasons, waitingReasonForRequestKind(event.request.kind));
    }
    if (event.type === "thread/status/changed" && event.threadId === threadId) {
      if (event.status === "waitingForInput") sawWaitingStatus = true;
      pushRuntimeWaitingReasons(reasons, event.runtimeStatus);
    }
    if (
      (event.type === "thread/started" || event.type === "thread/upserted") &&
      event.thread.id === threadId
    ) {
      if (event.status === "waitingForInput") sawWaitingStatus = true;
      pushRuntimeWaitingReasons(reasons, event.runtimeStatus);
    }
  }
  if (sawWaitingStatus && reasons.length === 0) reasons.push("unknown");
  return reasons;
}

function pushRuntimeWaitingReasons(
  reasons: AgentThreadWaitingReason[],
  runtimeStatus: AgentThreadRuntimeStatus | undefined,
): void {
  if (runtimeStatus?.type !== "active") return;
  for (const flag of runtimeStatus.activeFlags) {
    if (flag === "waitingOnApproval") pushUnique(reasons, "approval");
    if (flag === "waitingOnUserInput") pushUnique(reasons, "userInput");
  }
}

function pushUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value);
}

function waitingReasonForRequestKind(kind: string): AgentThreadWaitingReason {
  switch (kind) {
    case "commandApproval":
    case "fileChangeApproval":
      return "approval";
    case "permissionsApproval":
      return "permission";
    case "userInput":
      return "userInput";
    case "mcpElicitation":
      return "mcpElicitation";
    case "authRefresh":
      return "authRefresh";
    case "attestation":
      return "attestation";
    default:
      return "unknown";
  }
}
