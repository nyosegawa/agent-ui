import type { AgentThread, ThreadState } from "@nyosegawa/agent-ui-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconClose,
  IconHistory,
  IconSearch,
  buttonClass,
} from "../components-internal";
import { useAgentThreadHistory, useAgentThreadReader } from "../hooks";
import { useAgentContext } from "../provider";
import { rawThreadId } from "../thread-history";
import { compactPath, isRecord, stringField, useCompactLayout } from "./shared";

export function ThreadList({
  activeThreadId,
  footer,
  onSelectThread,
  threads,
}: {
  activeThreadId?: string;
  footer?: React.ReactNode;
  onSelectThread?: (threadId: string) => void;
  threads: ThreadState[];
}) {
  return (
    <nav className="aui-thread-list" aria-label="Threads">
      {threads.map((thread) => {
        const meta = threadListMeta(thread);
        return (
          <button
            aria-current={thread.thread.id === activeThreadId ? "page" : undefined}
            className="aui-thread-list-item"
            data-status={thread.status}
            key={thread.thread.id}
            onClick={() => onSelectThread?.(thread.thread.id)}
            type="button"
          >
            <span className="aui-thread-list-name">
              {thread.thread.name ?? thread.thread.id}
            </span>
            <span className="aui-thread-list-meta">
              <span
                aria-hidden="true"
                className="aui-thread-list-dot"
                data-status={thread.status}
              />
              <small>{meta}</small>
            </span>
          </button>
        );
      })}
      {footer}
    </nav>
  );
}

function threadListMeta(thread: ThreadState): string {
  const parts = [
    formatThreadStatus(thread.status, { hasTurns: thread.orderedTurnIds.length > 0 }),
  ];
  const updated = rawThreadDate(thread.thread.raw, [
    "updatedAt",
    "updated_at",
    "modifiedAt",
    "modified_at",
    "createdAt",
    "created_at",
  ]);
  if (updated) parts.push(updated);
  if (thread.thread.path && isUserFacingPath(thread.thread.path)) {
    parts.push(compactPath(thread.thread.path));
  }
  return parts.join(" · ");
}

function rawThreadDate(raw: unknown, keys: string[]): string | undefined {
  if (!isRecord(raw)) return undefined;
  for (const key of keys) {
    const value = raw[key];
    const date =
      typeof value === "number"
        ? new Date(value > 10_000_000_000 ? value : value * 1000)
        : typeof value === "string"
          ? new Date(value)
          : undefined;
    if (date && Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    }
  }
  return undefined;
}

export function formatThreadStatus(
  status: string,
  options: { hasTurns?: boolean } = {},
): string {
  switch (status) {
    case "notLoaded":
      return "Stored";
    case "loaded":
      return options.hasTurns ? "Preview" : "Ready";
    case "ready":
      return "Ready";
    case "running":
      return "Running";
    case "waitingForInput":
      return "Needs approval";
    case "complete":
    case "completed":
      return "Complete";
    case "error":
      return "Failed";
    default:
      return status
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^\w/, (letter) => letter.toUpperCase());
  }
}

export function threadSubtitle(thread: AgentThread): string {
  if (thread.path && isUserFacingPath(thread.path)) return thread.path;
  if (thread.ephemeral) return "Ephemeral Codex session";
  return "Codex session";
}

export function isUserFacingPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  if (normalized.endsWith(".jsonl")) return false;
  if (normalized.includes("/rollout-")) return false;
  return true;
}

export function AgentThreadSidebar({
  activeThreadId,
  collapsed = false,
  onCollapsedChange,
  onAutoActivateThread,
  onSelectThread,
  threads,
}: {
  activeThreadId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onAutoActivateThread?: (threadId: string) => void;
  onSelectThread?: (threadId: string) => void;
  threads: ThreadState[];
}) {
  const compact = useCompactLayout();
  const { cursor, error, isLoading, listThreads } = useAgentThreadHistory();
  const { state } = useAgentContext();
  const { readThread } = useAgentThreadReader();
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>();
  const [visibleThreadIds, setVisibleThreadIds] = useState<string[] | undefined>();
  const didAutoLoad = useRef(false);
  const searchTouched = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleThreads = useMemo(() => {
    if (!visibleThreadIds) return threads;
    const byId = new Map(threads.map((thread) => [thread.thread.id, thread]));
    return visibleThreadIds.flatMap((threadId) => {
      const thread = byId.get(threadId);
      return thread ? [thread] : [];
    });
  }, [threads, visibleThreadIds]);
  const loadThreadPage = useCallback(
    async (
      params: {
        activateFirst?: boolean;
        append?: boolean;
        cursor?: string | null;
        searchTerm?: string;
      } = {},
    ) => {
      const response = await listThreads({
        cursor: params.cursor,
        limit: 25,
        searchTerm: params.searchTerm,
      });
      const rawThreads = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.threads)
          ? response.threads
          : [];
      const threadIds = rawThreads.flatMap((rawThread: Record<string, unknown>) => {
        const threadId = rawThreadId(rawThread);
        return threadId ? [threadId] : [];
      });
      setVisibleThreadIds((current) => {
        if (!params.append) return threadIds;
        return Array.from(new Set([...(current ?? []), ...threadIds]));
      });
      setNextCursor(responseCursor(response));
      setHasLoaded(true);
      const firstThreadId = threadIds[0];
      if (params.activateFirst && firstThreadId && !state.activeThreadId) {
        onAutoActivateThread?.(firstThreadId);
        readThread(firstThreadId, { activate: true, includeTurns: true }).catch(() => {
          onSelectThread?.(firstThreadId);
        });
      }
      return response;
    },
    [listThreads, onAutoActivateThread, onSelectThread, readThread, state.activeThreadId],
  );
  const loadNextThreadPage = useCallback(() => {
    const pageCursor = nextCursor ?? cursor ?? null;
    if (!pageCursor || isLoading) return;
    void loadThreadPage({
      append: true,
      cursor: pageCursor,
      searchTerm,
    }).catch(() => undefined);
  }, [cursor, isLoading, loadThreadPage, nextCursor, searchTerm]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !(nextCursor ?? cursor)) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadNextThreadPage();
      },
      { root: sentinel.closest(".aui-thread-list"), rootMargin: "160px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadNextThreadPage, nextCursor]);
  useEffect(() => {
    if (
      state.connection.status === "connected" &&
      threads.length === 0 &&
      !isLoading &&
      !didAutoLoad.current
    ) {
      didAutoLoad.current = true;
      void loadThreadPage({ activateFirst: true }).catch(() => {
        setHasLoaded(true);
      });
    }
  }, [isLoading, loadThreadPage, state.connection.status, threads.length]);
  // Debounced search: typing auto-filters history without a separate Load
  // button. The leading render and the initial auto-load are skipped so the
  // first page is fetched exactly once.
  useEffect(() => {
    if (!searchTouched.current) return;
    const handle = setTimeout(() => {
      void loadThreadPage({ searchTerm }).catch(() => undefined);
    }, 320);
    return () => clearTimeout(handle);
  }, [loadThreadPage, searchTerm]);

  const selectThread = useCallback(
    (threadId: string) => {
      if (compact) onCollapsedChange?.(true);
      void readThread(threadId, { activate: true, includeTurns: true }).catch(() => {
        onSelectThread?.(threadId);
      });
    },
    [compact, onCollapsedChange, onSelectThread, readThread],
  );

  // On mobile a collapsed sidebar is a closed drawer with no inline chrome —
  // the open trigger lives in the chat header instead.
  if (collapsed && compact) return null;
  if (collapsed) {
    return (
      <aside className="aui-sidebar aui-sidebar-collapsed" data-collapsed="true">
        <button
          aria-label="Expand history"
          className={buttonClass("ghost", { iconOnly: true })}
          onClick={() => onCollapsedChange?.(false)}
          title="Expand history"
          type="button"
        >
          <IconHistory size={16} />
        </button>
      </aside>
    );
  }
  return (
    <aside className="aui-sidebar" data-collapsed="false">
      <div className="aui-sidebar-header">
        <div className="aui-sidebar-title">Threads</div>
        <button
          aria-label={compact ? "Close history" : "Collapse history"}
          className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
          onClick={() => onCollapsedChange?.(true)}
          title={compact ? "Close history" : "Collapse history"}
          type="button"
        >
          <IconClose size={14} />
        </button>
      </div>
      <form
        className="aui-history-controls"
        onSubmit={(event) => {
          event.preventDefault();
          void loadThreadPage({ searchTerm }).catch(() => undefined);
        }}
        role="search"
      >
        <div className="aui-input-shell aui-input-with-icon">
          <IconSearch size={14} />
          <input
            aria-label="Search history"
            className="aui-text-input"
            onChange={(event) => {
              searchTouched.current = true;
              setSearchTerm(event.currentTarget.value);
            }}
            placeholder="Search threads"
            type="search"
            value={searchTerm}
          />
          {isLoading ? (
            <span
              aria-hidden="true"
              className="aui-history-spinner"
              data-testid="history-loading"
            />
          ) : null}
        </div>
      </form>
      <div className="aui-history-feedback" aria-live="polite">
        {error ? <p className="aui-sidebar-error">{error.message}</p> : null}
        {!isLoading && hasLoaded && visibleThreads.length === 0 ? (
          <p className="aui-sidebar-status">No threads found.</p>
        ) : null}
        {hasLoaded && visibleThreads.length > 0 ? (
          <p className="aui-sidebar-status">
            {visibleThreads.length} {visibleThreads.length === 1 ? "thread" : "threads"}{" "}
            loaded
            {(nextCursor ?? cursor) ? " · more available" : " · all loaded"}
          </p>
        ) : null}
      </div>
      <ThreadList
        activeThreadId={activeThreadId}
        footer={
          nextCursor ?? cursor ? (
            <div className="aui-thread-list-sentinel" ref={sentinelRef}>
              <button
                className={buttonClass("subtle", { size: "sm" })}
                disabled={isLoading}
                onClick={loadNextThreadPage}
                type="button"
              >
                {isLoading ? "Loading" : "Load more"}
              </button>
            </div>
          ) : null
        }
        onSelectThread={selectThread}
        threads={visibleThreads}
      />
    </aside>
  );
}

function responseCursor(response: Record<string, unknown> | undefined): string | null {
  if (!response) return null;
  return stringField(response, "nextCursor") ?? stringField(response, "next_cursor") ?? null;
}
