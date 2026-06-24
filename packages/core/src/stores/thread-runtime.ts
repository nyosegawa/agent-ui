import type {
  AgentServerRequestSummary,
  AgentSessionState,
  AgentThreadActiveFlag,
  AgentThreadRuntimeState,
  AgentThreadRuntimeStatus,
  AgentThreadWaitingReason,
  AgentTurn,
  AgentTurnResult,
  PendingServerRequest,
  ThreadStatus,
  ThreadState,
  TurnId,
} from "../state";

export function threadRuntimeFromStatus(
  status?: ThreadStatus,
): AgentThreadRuntimeState {
  return {
    status: threadRuntimeStatusFromLegacyStatus(status),
  };
}

export function threadRuntimeStatusFromLegacyStatus(
  status?: ThreadStatus,
): AgentThreadRuntimeStatus {
  if (status === "notLoaded") return { type: "notLoaded" };
  if (status === "running") return { activeFlags: [], type: "active" };
  if (status === "waitingForInput") {
    return {
      activeFlags: ["waitingOnApproval", "waitingOnUserInput"],
      type: "active",
    };
  }
  if (status === "error" || status === "failed" || status === "systemError") {
    return { type: "systemError" };
  }
  return { type: "idle" };
}

export function threadActivityFromRuntime(
  runtime: AgentThreadRuntimeState,
): "failed" | "idle" | "running" | "waitingForInput" {
  if (runtime.status.type === "systemError") return "failed";
  if (runtime.status.type !== "active") return "idle";
  return runtime.status.activeFlags.length > 0 ? "waitingForInput" : "running";
}

export function mergeRuntimeStatus(
  current: AgentThreadRuntimeState | undefined,
  status: AgentThreadRuntimeStatus,
): AgentThreadRuntimeState {
  return {
    ...current,
    status: normalizeRuntimeStatus(status),
  };
}

export function runtimeWithStartedTurn(
  current: AgentThreadRuntimeState | undefined,
  turn: AgentTurn,
): AgentThreadRuntimeState {
  return {
    ...current,
    activeTurnId: turn.id,
    status: { activeFlags: [], type: "active" },
  };
}

export function runtimeWithCompletedTurn(
  current: AgentThreadRuntimeState | undefined,
  turn: AgentTurn,
): AgentThreadRuntimeState {
  return {
    activeTurnId: undefined,
    lastTurn: {
      result: turnResultFromStatus(turn.status),
      ...(turn.status ? { status: turn.status } : {}),
      turnId: turn.id,
    },
    status: threadRuntimeStatusFromCompletedTurnStatus(turn.status),
  };
}

export function runtimeWithPendingRequests(
  current: AgentThreadRuntimeState | undefined,
  requests: readonly PendingServerRequest[],
  fallbackStatusOrRuntime?: ThreadStatus | AgentThreadRuntimeStatus,
): AgentThreadRuntimeState {
  const base = runtimeFromFallback(current, fallbackStatusOrRuntime);
  if (requests.length === 0) {
    return base;
  }
  const activeTurnId = latestTurnId(requests) ?? base.activeTurnId;
  return {
    ...base,
    ...(activeTurnId ? { activeTurnId } : {}),
    status: {
      activeFlags: activeFlagsForRequests(requests),
      type: "active",
    },
  };
}

export function runtimeWithServerRequestOverlay(
  state: AgentSessionState,
  thread: ThreadState,
  fallbackStatusOrRuntime?: ThreadStatus | AgentThreadRuntimeStatus,
): AgentThreadRuntimeState {
  return runtimeWithPendingRequests(
    thread.runtime,
    Object.values(state.serverRequestQueue.byId).filter(
      (request) => request.threadId === thread.id,
    ),
    fallbackStatusOrRuntime,
  );
}

export function summarizeServerRequest(
  request: PendingServerRequest,
): AgentServerRequestSummary {
  return {
    id: request.id,
    ...(request.itemId ? { itemId: request.itemId } : {}),
    kind: request.kind,
    ...(request.threadId ? { threadId: request.threadId } : {}),
    ...(request.turnId ? { turnId: request.turnId } : {}),
    visible: request.kind !== "dynamicTool",
    waitingReason: waitingReasonForRequestKind(request.kind),
  };
}

export function waitingReasonForRequestKind(
  kind: PendingServerRequest["kind"],
): AgentThreadWaitingReason {
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
    case "dynamicTool":
    case "unknown":
      return "unknown";
  }
}

function threadRuntimeStatusFromCompletedTurnStatus(
  status: string | undefined,
): AgentThreadRuntimeStatus {
  if (status === "error" || status === "failed") return { type: "systemError" };
  return { type: "idle" };
}

function turnResultFromStatus(status: string | undefined): AgentTurnResult {
  if (
    status === "completed" ||
    status === "error" ||
    status === "failed" ||
    status === "interrupted"
  ) {
    return status;
  }
  return "unknown";
}

function activeFlagsForRequests(
  requests: readonly PendingServerRequest[],
): AgentThreadActiveFlag[] {
  const flags = new Set<AgentThreadActiveFlag>();
  for (const request of requests) {
    if (request.kind === "dynamicTool") continue;
    if (waitingReasonForRequestKind(request.kind) === "approval") {
      flags.add("waitingOnApproval");
    } else {
      flags.add("waitingOnUserInput");
    }
  }
  return [...flags];
}

function latestTurnId(requests: readonly PendingServerRequest[]): TurnId | undefined {
  for (let index = requests.length - 1; index >= 0; index -= 1) {
    const turnId = requests[index]?.turnId;
    if (turnId) return turnId;
  }
  return undefined;
}

function runtimeFromFallback(
  current: AgentThreadRuntimeState | undefined,
  fallbackStatusOrRuntime?: ThreadStatus | AgentThreadRuntimeStatus,
): AgentThreadRuntimeState {
  if (!fallbackStatusOrRuntime) {
    return current ?? threadRuntimeFromStatus(undefined);
  }
  if (typeof fallbackStatusOrRuntime === "string") {
    return {
      ...current,
      status:
        fallbackStatusOrRuntime === "waitingForInput"
          ? threadRuntimeStatusFromLegacyStatus("running")
          : threadRuntimeStatusFromLegacyStatus(fallbackStatusOrRuntime),
    };
  }
  return mergeRuntimeStatus(current, fallbackStatusOrRuntime);
}

function normalizeRuntimeStatus(
  status: AgentThreadRuntimeStatus,
): AgentThreadRuntimeStatus {
  if (status.type !== "active") return status;
  return {
    activeFlags: status.activeFlags.filter(
      (flag, index, flags) => flags.indexOf(flag) === index,
    ),
    type: "active",
  };
}
