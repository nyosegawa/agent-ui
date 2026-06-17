import type { AgentThread, AgentThreadView } from "@nyosegawa/agent-ui-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconAdd,
  IconClose,
  IconHistory,
  IconSearch,
  buttonClass,
} from "../components-internal";
import { useAgentThreadListController } from "../hooks/thread-list";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import { useAgentContext } from "../provider";
import { compactPath, useCompactLayout } from "./shared";

export function ThreadList({
  activeThreadId,
  footer,
  onSelectThread,
  threads,
}: {
  activeThreadId?: string;
  footer?: React.ReactNode;
  onSelectThread?: (threadId: string) => void;
  threads: AgentThreadView[];
}) {
  const { t } = useAgentI18n();
  return (
    <nav className="aui-thread-list" aria-label={t("aria.threads")}>
      {threads.map((thread) => {
        const meta = threadListMeta(thread, t);
        const status = threadListStatus(thread);
        return (
          <button
            aria-current={thread.id === activeThreadId ? "page" : undefined}
            className="aui-thread-list-item"
            data-status={status}
            key={thread.id}
            onClick={() => onSelectThread?.(thread.id)}
            type="button"
          >
            <span className="aui-thread-list-name">
              {thread.title}
            </span>
            <span className="aui-thread-list-meta">
              <span
                aria-hidden="true"
                className="aui-thread-list-dot"
                data-status={status}
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

function threadListMeta(
  thread: AgentThreadView,
  t: (key: AgentI18nKey) => string,
): string {
  const parts = [formatThreadStatus(threadListStatus(thread), { t })];
  if (thread.lastActivityAt) parts.push(formatThreadDate(thread.lastActivityAt));
  const path = thread.cwd ?? thread.subtitle;
  if (path && isUserFacingPath(path)) parts.push(compactPath(path));
  return parts.join(" · ");
}

function threadListStatus(thread: AgentThreadView): string {
  if (thread.error) return "error";
  if (thread.needsInput) return "waitingForInput";
  if (thread.isRunning) return "running";
  if (thread.isPreview) return "preview";
  if (thread.isArchived) return "archived";
  return "ready";
}

function formatThreadDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function formatThreadStatus(
  status: string,
  options: { hasTurns?: boolean; t?: (key: AgentI18nKey) => string } = {},
): string {
  const t = options.t ?? fallbackThreadT;
  switch (status) {
    case "notLoaded":
      return t("thread.status.stored");
    case "loaded":
      return options.hasTurns ? t("thread.status.preview") : t("thread.status.ready");
    case "preview":
      return t("thread.status.preview");
    case "ready":
      return t("thread.status.ready");
    case "running":
      return t("thread.status.running");
    case "waitingForInput":
      return t("thread.status.needsApproval");
    case "complete":
    case "completed":
      return t("thread.status.complete");
    case "error":
      return t("thread.status.failed");
    default:
      return status
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^\w/, (letter) => letter.toUpperCase());
  }
}

export function threadSubtitle(
  thread: AgentThread,
  t: (key: AgentI18nKey) => string = fallbackThreadT,
): string {
  if (thread.path && isUserFacingPath(thread.path)) return thread.path;
  if (thread.ephemeral) return t("thread.ephemeralSession");
  return t("thread.codexSession");
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
  onCreateThread,
  onCollapsedChange,
  onSelectThread,
}: {
  activeThreadId?: string;
  collapsed?: boolean;
  onCreateThread?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onSelectThread?: (threadId: string) => void;
}) {
  const { t } = useAgentI18n();
  const compact = useCompactLayout();
  const sidebarHistoryScope = useMemo(() => ({ kind: "history" as const }), []);
  const threadList = useAgentThreadListController(sidebarHistoryScope);
  const {
    activateThread,
    error,
    hasLoaded,
    isLoading,
    listThreads,
    nextCursor,
    searchTerm,
    setSearchTerm,
    threads: listedThreads,
  } = threadList;
  const { state } = useAgentContext();
  const didAutoLoad = useRef(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleThreads = listedThreads;
  const loadThreadPage = useCallback(
    async (
      params: {
        append?: boolean;
        cursor?: string | null;
        searchTerm?: string;
      } = {},
    ) => {
      return listThreads({
        append: params.append,
        cursor: params.cursor,
        limit: 25,
        searchTerm: params.searchTerm,
      });
    },
    [listThreads],
  );
  const loadNextThreadPage = useCallback(() => {
    const pageCursor = nextCursor;
    if (!pageCursor || isLoading) return;
    void loadThreadPage({
      append: true,
      cursor: pageCursor,
      searchTerm,
    }).catch(() => undefined);
  }, [isLoading, loadThreadPage, nextCursor, searchTerm]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextCursor) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadNextThreadPage();
      },
      { root: sentinel.closest(".aui-thread-list"), rootMargin: "160px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextThreadPage, nextCursor]);
  useEffect(() => {
    if (
      state.connection.status === "connected" &&
      !hasLoaded &&
      !isLoading &&
      !didAutoLoad.current
    ) {
      didAutoLoad.current = true;
      void loadThreadPage().catch(() => undefined);
    }
  }, [hasLoaded, isLoading, loadThreadPage, state.connection.status]);
  // Debounced search: typing auto-filters history without a separate Load
  // button. The leading render and the initial auto-load are skipped so the
  // first page is fetched exactly once.
  useEffect(() => {
    if (!searchTouched) return;
    const handle = setTimeout(() => {
      void loadThreadPage({ searchTerm }).catch(() => undefined);
    }, 320);
    return () => clearTimeout(handle);
  }, [loadThreadPage, searchTerm, searchTouched]);

  const selectThread = useCallback(
    (threadId: string) => {
      if (compact) onCollapsedChange?.(true);
      const openThread = activateThread(threadId);
      void openThread
        .then((selectedThreadId) => {
          onSelectThread?.(selectedThreadId);
        })
        .catch(() => undefined);
    },
    [activateThread, compact, onCollapsedChange, onSelectThread],
  );
  const createThread = useCallback(() => {
    if (compact) onCollapsedChange?.(true);
    onCreateThread?.();
  }, [compact, onCollapsedChange, onCreateThread]);

  // On mobile a collapsed sidebar is a closed drawer with no inline chrome —
  // the open trigger lives in the chat header instead.
  if (collapsed && compact) return null;
  if (collapsed) {
    return (
      <aside className="aui-sidebar aui-sidebar-collapsed" data-collapsed="true">
        <button
          aria-label={t("thread.expandHistory")}
          className={buttonClass("ghost", { iconOnly: true })}
          onClick={() => onCollapsedChange?.(false)}
          title={t("thread.expandHistory")}
          type="button"
        >
          <IconHistory size={16} />
        </button>
        {onCreateThread ? (
          <button
            aria-label={t("thread.new")}
            className={buttonClass("ghost", { iconOnly: true })}
            onClick={createThread}
            title={t("thread.new")}
            type="button"
          >
            <IconAdd size={16} />
          </button>
        ) : null}
      </aside>
    );
  }
  return (
    <aside className="aui-sidebar" data-collapsed="false">
      <div className="aui-sidebar-header">
        <div className="aui-sidebar-title">{t("thread.history")}</div>
        <div className="aui-sidebar-header-actions">
          {onCreateThread ? (
            <button
              aria-label={t("thread.new")}
              className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
              onClick={createThread}
              title={t("thread.new")}
              type="button"
            >
              <IconAdd size={14} />
            </button>
          ) : null}
          <button
            aria-label={compact ? t("thread.closeHistory") : t("thread.collapseHistory")}
            className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
            onClick={() => onCollapsedChange?.(true)}
            title={compact ? t("thread.closeHistory") : t("thread.collapseHistory")}
            type="button"
          >
            <IconClose size={14} />
          </button>
        </div>
      </div>
      <form
        className="aui-history-controls"
        onSubmit={(event) => {
          event.preventDefault();
          setSearchTouched(true);
          void loadThreadPage({ searchTerm }).catch(() => undefined);
        }}
        role="search"
      >
        <div className="aui-input-shell aui-input-with-icon">
          <IconSearch size={14} />
          <input
            aria-label={t("thread.searchHistory")}
            className="aui-text-input"
            onChange={(event) => {
              setSearchTouched(true);
              setSearchTerm(event.currentTarget.value);
            }}
            placeholder={t("thread.search")}
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
        {error ? (
          <p className="aui-sidebar-error">{error.message}</p>
        ) : null}
        {!isLoading && hasLoaded && visibleThreads.length === 0 ? (
          <p className="aui-sidebar-status">{t("thread.noThreadsFound")}</p>
        ) : null}
      </div>
      <ThreadList
        activeThreadId={activeThreadId}
        footer={
          nextCursor ? (
            <div className="aui-thread-list-sentinel" ref={sentinelRef}>
              <button
                className={buttonClass("subtle", { size: "sm" })}
                disabled={isLoading}
                onClick={loadNextThreadPage}
                type="button"
              >
                {isLoading ? t("common.loading") : t("apps.loadMore")}
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

function fallbackThreadT(key: AgentI18nKey): string {
  const fallback: Partial<Record<AgentI18nKey, string>> = {
    "thread.codexSession": "Codex session",
    "thread.ephemeralSession": "Ephemeral Codex session",
    "thread.status.complete": "Complete",
    "thread.status.failed": "Failed",
    "thread.status.needsApproval": "Needs approval",
    "thread.status.preview": "Preview",
    "thread.status.ready": "Ready",
    "thread.status.running": "Running",
    "thread.status.stored": "Stored",
  };
  return fallback[key] ?? key;
}
