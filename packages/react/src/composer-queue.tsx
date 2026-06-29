import type {
  AgentSessionState,
  ThreadId,
  ThreadStatus,
} from "@nyosegawa/agent-ui-core/internal";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { AgentUserInput } from "./agent-input";
import { sharedReactContext } from "./context-registry";

export interface QueuedFollowUp {
  attachments: QueuedFollowUpAttachment[];
  expectedTurnId?: string;
  id: string;
  input: AgentUserInput[];
  text: string;
  threadId: ThreadId;
}

export interface QueuedFollowUpAttachment {
  displayName?: string;
  extension?: string;
  id: string;
  input: AgentUserInput | AgentUserInput[];
  kind: "image" | "file" | "integration";
  label: string;
  previewUrl?: string;
  previewUrlRevoke?: boolean;
  redactedPath?: string;
  sizeLabel?: string;
  value?: string;
}

export interface AgentComposerQueueStore {
  clearThreadFollowUps: (threadId: ThreadId) => void;
  enqueueFollowUp: (item: Omit<QueuedFollowUp, "id">) => string;
  followUpErrors: Record<string, string>;
  markFollowUpIdle: (id: string) => void;
  markFollowUpSending: (id: string) => void;
  queuedFollowUps: QueuedFollowUp[];
  removeFollowUp: (
    id: string,
    threadId: ThreadId,
    options?: { revokePreviewUrls?: boolean },
  ) => void;
  sendingFollowUpIds: string[];
  setFollowUpError: (id: string, error: string | undefined) => void;
  takeFollowUpForEdit: (id: string, threadId: ThreadId) => QueuedFollowUp | undefined;
}

const AgentComposerQueueContext = sharedReactContext<AgentComposerQueueStore | null>(
  "@nyosegawa/agent-ui-react/v1/AgentComposerQueueContext",
  null,
);

export function AgentComposerQueueProvider({
  children,
  sessionState,
}: PropsWithChildren<{ sessionState?: AgentSessionState }>) {
  const [queuedFollowUps, setQueuedFollowUps] = useState<QueuedFollowUp[]>([]);
  const [sendingFollowUpIds, setSendingFollowUpIds] = useState<string[]>([]);
  const [followUpErrors, setFollowUpErrors] = useState<Record<string, string>>({});
  const queuedFollowUpsRef = useRef<QueuedFollowUp[]>([]);
  const revokedPreviewUrlsRef = useRef(new Set<string>());
  const fallbackIdCounter = useRef(0);

  const createFollowUpId = useCallback((threadId: ThreadId) => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `follow-up-${crypto.randomUUID()}`;
    }
    return `follow-up-${threadId}-${fallbackIdCounter.current++}`;
  }, []);

  const revokeFollowUpPreviews = useCallback((item: QueuedFollowUp) => {
    for (const attachment of item.attachments) {
      if (!attachment.previewUrl || !attachment.previewUrlRevoke) continue;
      if (revokedPreviewUrlsRef.current.has(attachment.previewUrl)) continue;
      revokedPreviewUrlsRef.current.add(attachment.previewUrl);
      URL.revokeObjectURL(attachment.previewUrl);
    }
  }, []);

  useEffect(() => {
    queuedFollowUpsRef.current = queuedFollowUps;
  }, [queuedFollowUps]);

  useEffect(
    () => () => {
      for (const item of queuedFollowUpsRef.current) revokeFollowUpPreviews(item);
    },
    [revokeFollowUpPreviews],
  );

  const enqueueFollowUp = useCallback((item: Omit<QueuedFollowUp, "id">) => {
    const id = createFollowUpId(item.threadId);
    const queuedItem = { ...item, id };
    setFollowUpErrors((current) => withoutRecordKey(current, id));
    setQueuedFollowUps((current) => {
      const next = [...current, queuedItem];
      queuedFollowUpsRef.current = next;
      return next;
    });
    return id;
  }, [createFollowUpId]);

  const setFollowUpError = useCallback((id: string, error: string | undefined) => {
    setFollowUpErrors((current) =>
      error ? { ...current, [id]: error } : withoutRecordKey(current, id),
    );
  }, []);

  const markFollowUpSending = useCallback((id: string) => {
    setSendingFollowUpIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const markFollowUpIdle = useCallback((id: string) => {
    setSendingFollowUpIds((current) => current.filter((followUpId) => followUpId !== id));
  }, []);

  const removeFollowUp = useCallback(
    (
      id: string,
      threadId: ThreadId,
      { revokePreviewUrls = true }: { revokePreviewUrls?: boolean } = {},
    ) => {
      const removed = queuedFollowUpsRef.current.find(
        (followUp) => followUp.id === id && followUp.threadId === threadId,
      );
      setQueuedFollowUps((current) => {
        const next = current.filter(
          (followUp) => followUp.id !== id || followUp.threadId !== threadId,
        );
        queuedFollowUpsRef.current = next;
        return next;
      });
      if (removed && revokePreviewUrls) revokeFollowUpPreviews(removed);
      setFollowUpErrors((current) => withoutRecordKey(current, id));
      setSendingFollowUpIds((current) => current.filter((followUpId) => followUpId !== id));
    },
    [revokeFollowUpPreviews],
  );

  const takeFollowUpForEdit = useCallback((id: string, threadId: ThreadId) => {
    const removed = queuedFollowUpsRef.current.find(
      (followUp) => followUp.id === id && followUp.threadId === threadId,
    );
    setQueuedFollowUps((current) => {
      const next = current.filter(
        (followUp) => followUp.id !== id || followUp.threadId !== threadId,
      );
      queuedFollowUpsRef.current = next;
      return next;
    });
    setFollowUpErrors((current) => withoutRecordKey(current, id));
    setSendingFollowUpIds((current) => current.filter((followUpId) => followUpId !== id));
    return removed;
  }, []);

  const clearThreadFollowUps = useCallback(
    (threadId: ThreadId) => {
      const removed = queuedFollowUpsRef.current.filter(
        (followUp) => followUp.threadId === threadId,
      );
      for (const item of removed) revokeFollowUpPreviews(item);
      setQueuedFollowUps((current) => {
        const next = current.filter((followUp) => followUp.threadId !== threadId);
        queuedFollowUpsRef.current = next;
        return next;
      });
      setFollowUpErrors((current) => {
        let next = current;
        for (const item of removed) next = withoutRecordKey(next, item.id);
        return next;
      });
      setSendingFollowUpIds((current) =>
        current.filter((id) => !removed.some((item) => item.id === id)),
      );
    },
    [revokeFollowUpPreviews],
  );

  useEffect(() => {
    if (!sessionState) return;
    const queuedThreadIds = new Set(
      queuedFollowUps.map((followUp) => followUp.threadId),
    );
    for (const threadId of queuedThreadIds) {
      const status = sessionState.threads[threadId]?.status;
      if (status && shouldClearQueuedFollowUpsForStatus(status)) {
        clearThreadFollowUps(threadId);
      }
    }
  }, [clearThreadFollowUps, queuedFollowUps, sessionState]);

  const value = useMemo(
    () => ({
      clearThreadFollowUps,
      enqueueFollowUp,
      followUpErrors,
      markFollowUpIdle,
      markFollowUpSending,
      queuedFollowUps,
      removeFollowUp,
      sendingFollowUpIds,
      setFollowUpError,
      takeFollowUpForEdit,
    }),
    [
      clearThreadFollowUps,
      enqueueFollowUp,
      followUpErrors,
      markFollowUpIdle,
      markFollowUpSending,
      queuedFollowUps,
      removeFollowUp,
      sendingFollowUpIds,
      setFollowUpError,
      takeFollowUpForEdit,
    ],
  );

  return (
    <AgentComposerQueueContext.Provider value={value}>
      {children}
    </AgentComposerQueueContext.Provider>
  );
}

export function useAgentComposerQueueStore(): AgentComposerQueueStore {
  const context = useContext(AgentComposerQueueContext);
  if (!context) throw new Error("Agent hooks must be used inside AgentProvider");
  return context;
}

function withoutRecordKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
}

function shouldClearQueuedFollowUpsForStatus(status: ThreadStatus): boolean {
  return status === "archived" || status === "closed";
}
