import type { AgentEvent, AgentTransport } from "@nyosegawa/agent-ui-core";
import { useEffect } from "react";

type TransportListener = (event: AgentEvent) => void;

interface TransportLease {
  closeTimer?: ReturnType<typeof setTimeout>;
  connected?: Promise<void>;
  listeners: Set<TransportListener>;
  refs: number;
  readerStarted: boolean;
  warningSequence: number;
}

const transportLeases = new WeakMap<AgentTransport, TransportLease>();

export function useAgentTransportEvents(
  transport: AgentTransport,
  dispatch: (event: AgentEvent) => void,
) {
  useEffect(() => {
    const listener: TransportListener = (event) => dispatch(event);
    const lease = acquireTransportLease(transport, listener);
    return () => releaseTransportLease(transport, lease, listener);
  }, [dispatch, transport]);
}

function acquireTransportLease(
  transport: AgentTransport,
  listener: TransportListener,
): TransportLease {
  const lease = transportLeases.get(transport) ?? {
    listeners: new Set<TransportListener>(),
    refs: 0,
    readerStarted: false,
    warningSequence: 0,
  };
  if (lease.closeTimer) {
    clearTimeout(lease.closeTimer);
    lease.closeTimer = undefined;
  }
  lease.refs += 1;
  lease.listeners.add(listener);
  transportLeases.set(transport, lease);
  lease.connected ??= transport.connect().catch((error: unknown) => {
    dispatchToLease(lease, {
      error: { message: error instanceof Error ? error.message : String(error) },
      type: "connection/error",
    });
  });
  if (!lease.readerStarted) {
    lease.readerStarted = true;
    void readTransportEvents(transport, lease);
  }
  return lease;
}

function releaseTransportLease(
  transport: AgentTransport,
  lease: TransportLease,
  listener: TransportListener,
): void {
  lease.listeners.delete(listener);
  lease.refs = Math.max(0, lease.refs - 1);
  if (lease.refs > 0) return;
  lease.closeTimer = setTimeout(() => {
    if (lease.refs > 0) return;
    transportLeases.delete(transport);
    void transport.close();
  }, 0);
}

async function readTransportEvents(
  transport: AgentTransport,
  lease: TransportLease,
): Promise<void> {
  for await (const event of transport.events) {
    if (event.event) dispatchToLease(lease, event.event);
    if (event.error) dispatchToLease(lease, { error: event.error, type: "error/added" });
    if (event.message) {
      for (const [index, message] of normalizeTransportMessages(event.message).entries()) {
        dispatchToLease(lease, {
          type: "warning/added",
          warning: {
            audience: ["developer", "audit"],
            id: `stderr-${lease.warningSequence++}-${index}`,
            message,
          },
        });
      }
    }
  }
}

function dispatchToLease(lease: TransportLease, event: AgentEvent): void {
  for (const listener of lease.listeners) listener(event);
}

function normalizeTransportMessages(message: string): string[] {
  return message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(formatTransportMessage);
}

function formatTransportMessage(message: string): string {
  try {
    const parsed = JSON.parse(message) as {
      fields?: { message?: unknown; path?: unknown };
      level?: unknown;
      target?: unknown;
    };
    const text =
      typeof parsed.fields?.message === "string" ? parsed.fields.message : message;
    const level = typeof parsed.level === "string" ? parsed.level : undefined;
    const target = typeof parsed.target === "string" ? parsed.target : undefined;
    const path = typeof parsed.fields?.path === "string" ? parsed.fields.path : undefined;
    return [level, target, text, path ? `(${path})` : undefined]
      .filter(Boolean)
      .join(" ");
  } catch {
    return message;
  }
}
