import type { CodexStable } from "@nyosegawa/agent-ui-codex/stable-types";
import { useContext, useMemo, useRef, type ReactNode } from "react";
import type { AgentUserInput } from "./agent-input";
import { sharedReactContext } from "./context-registry";
import type { ThreadStartOptions, TurnStartOptions } from "./request-options";

export interface FirstMessageOperationIds {
  operationId: string;
  threadId: string;
  turnId: string;
  userMessageId: string;
}

export interface FirstMessageRetryPayload {
  displayText: string;
  input: string | AgentUserInput[];
  normalizedInput: string | CodexStable.v2.TurnStartParams["input"];
  params?: ThreadStartOptions;
  pending: FirstMessageOperationIds;
  threadId?: string;
  turnOptions?: TurnStartOptions;
}

export interface FirstMessageOperationRuntime {
  beginRetry: (operationId: string) => boolean;
  cancel: (operationId: string) => void;
  forget: (operationId: string) => void;
  getPayload: (operationId: string) => FirstMessageRetryPayload | undefined;
  hasPayload: (operationId: string) => boolean;
  isCancelled: (operationId: string) => boolean;
  remember: (payload: FirstMessageRetryPayload) => void;
  resetCancellation: (operationId: string) => void;
  stopRetry: (operationId: string) => void;
}

const FirstMessageOperationContext =
  sharedReactContext<FirstMessageOperationRuntime | null>(
    "@nyosegawa/agent-ui-react/v1/FirstMessageOperationContext",
    null,
  );

export function AgentFirstMessageOperationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const payloads = useRef(new Map<string, FirstMessageRetryPayload>());
  const cancelled = useRef(new Set<string>());
  const retrying = useRef(new Set<string>());
  const runtime = useMemo<FirstMessageOperationRuntime>(
    () => ({
      beginRetry(operationId) {
        if (retrying.current.has(operationId)) return false;
        retrying.current.add(operationId);
        return true;
      },
      cancel(operationId) {
        cancelled.current.add(operationId);
        retrying.current.delete(operationId);
      },
      forget(operationId) {
        payloads.current.delete(operationId);
      },
      getPayload(operationId) {
        return payloads.current.get(operationId);
      },
      hasPayload(operationId) {
        return payloads.current.has(operationId);
      },
      isCancelled(operationId) {
        return cancelled.current.has(operationId);
      },
      remember(payload) {
        payloads.current.set(payload.pending.operationId, payload);
      },
      resetCancellation(operationId) {
        cancelled.current.delete(operationId);
      },
      stopRetry(operationId) {
        retrying.current.delete(operationId);
      },
    }),
    [],
  );
  return (
    <FirstMessageOperationContext.Provider value={runtime}>
      {children}
    </FirstMessageOperationContext.Provider>
  );
}

export function useFirstMessageOperationRuntime(): FirstMessageOperationRuntime {
  const runtime = useContext(FirstMessageOperationContext);
  if (!runtime) {
    throw new Error("First message operations must be used inside AgentProvider");
  }
  return runtime;
}

export function createFirstMessageOperationIds(): FirstMessageOperationIds {
  const id = randomOperationSuffix();
  return {
    operationId: `first-message-${id}`,
    threadId: `pending-thread-${id}`,
    turnId: `pending-turn-${id}`,
    userMessageId: `pending-user-message-${id}`,
  };
}

function randomOperationSuffix() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
