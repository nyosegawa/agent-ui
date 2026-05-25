import type React from "react";
import type {
  AgentItemState,
  PendingServerRequest,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAgentBootstrap,
  useAgentThread,
  useAgentThreadReader,
  useAgentThreads,
} from "../hooks";
import { useAgentContext } from "../provider";
import { AgentThreadView } from "./thread";
import type {
  AgentComposerMentionResolver,
  AgentLocalAttachmentResolver,
} from "./composer";
import { AgentFirstRun } from "./first-run";
import { AgentThreadSidebar } from "./sidebar";
import { useCompactLayout } from "./shared";
import {
  AgentDiagnosticsPanel,
  AgentStatusBar,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentUsagePanel,
} from "./status";

export interface AgentChatSlots {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
}

export interface AgentChatProps {
  className?: string;
  diagnostics?: boolean;
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  sidebar?: boolean;
  slots?: AgentChatSlots;
  threadUrlRouting?: boolean | AgentThreadUrlRoutingOptions;
  usage?: boolean;
}

export interface AgentThreadUrlRoutingOptions {
  basePath?: string;
}

export function AgentChat({
  className,
  diagnostics = false,
  onRequestAppMention,
  onRequestPluginMention,
  resolveLocalAttachment,
  sidebar = true,
  slots,
  threadUrlRouting = false,
  usage = false,
}: AgentChatProps = {}) {
  const bootstrap = useAgentBootstrap();
  const compact = useCompactLayout();
  const { thread, threadId, startThread } = useAgentThread();
  const { threads, activeThreadId, setActiveThread } = useAgentThreads();
  useThreadUrlRouting(threadUrlRouting, activeThreadId);
  // Desktop keeps an expand/collapse rail; mobile keeps an off-canvas drawer.
  // Tracking them separately means a viewport change never strands the user
  // with the wrong default.
  const [sidebarOpenDesktop, setSidebarOpenDesktop] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const isSidebarCollapsed = compact ? !sidebarOpenMobile : !sidebarOpenDesktop;
  const setSidebarCollapsed = useCallback(
    (next: boolean) => {
      if (compact) setSidebarOpenMobile(!next);
      else setSidebarOpenDesktop(!next);
    },
    [compact],
  );
  const hasRail = usage || diagnostics;
  const drawerOpen = compact && sidebar && !isSidebarCollapsed;
  return (
    <AgentShell
      className={className}
      data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
      data-sidebar-drawer={drawerOpen ? "open" : "closed"}
      sidebar={
        sidebar ? (
          <AgentThreadSidebar
            activeThreadId={activeThreadId}
            collapsed={isSidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            onSelectThread={setActiveThread}
            threads={threads}
          />
        ) : undefined
      }
    >
      {drawerOpen ? (
        <button
          aria-label="Dismiss thread history"
          className="aui-sidebar-backdrop"
          onClick={() => setSidebarCollapsed(true)}
          type="button"
        />
      ) : null}
      <div className="aui-chat">
        <AgentStatusBar
          onOpenThreads={
            sidebar ? () => setSidebarCollapsed(false) : undefined
          }
        />
        <div className="aui-chat-body" data-rail={hasRail ? "visible" : "hidden"}>
          <div className="aui-thread-column">
            {thread ? (
              <AgentThreadView
                onRequestAppMention={onRequestAppMention}
                onRequestPluginMention={onRequestPluginMention}
                renderApproval={slots?.renderApproval}
                renderItem={slots?.renderItem}
                resolveLocalAttachment={resolveLocalAttachment}
                threadId={threadId}
              />
            ) : (
              <div className="aui-empty">
                <AgentFirstRun onStartThread={() => void startThread()} />
              </div>
            )}
          </div>
          {hasRail ? (
            <aside className="aui-chat-rail" aria-label="Agent context">
              <AgentStatusSummary />
              <AgentStatusDetails />
              {usage ? <AgentUsagePanel autoRefresh={false} /> : null}
              {diagnostics ? <AgentDiagnosticsPanel bootstrap={bootstrap} /> : null}
            </aside>
          ) : null}
        </div>
      </div>
    </AgentShell>
  );
}

function useThreadUrlRouting(
  options: AgentChatProps["threadUrlRouting"],
  activeThreadId?: string,
): void {
  const { state } = useAgentContext();
  const { readThread } = useAgentThreadReader();
  const { setActiveThread, threads } = useAgentThreads();
  const lastPathRef = useRef<string | undefined>(undefined);
  const initialUrlThreadReadRef = useRef<string | undefined>(undefined);
  const enabled = Boolean(options);
  const basePath = threadUrlRoutingBasePath(options);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (state.connection.status !== "connected") return;
    const initialThreadId = threadIdFromPath(window.location.pathname, basePath);
    if (!initialThreadId || initialUrlThreadReadRef.current === initialThreadId) return;
    initialUrlThreadReadRef.current = initialThreadId;
    void readThread(initialThreadId, { activate: true, includeTurns: true }).catch(() => {
      if (initialUrlThreadReadRef.current === initialThreadId) {
        initialUrlThreadReadRef.current = undefined;
      }
    });
  }, [basePath, enabled, readThread, state.connection.status]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !activeThreadId) return;
    const path = threadPath(activeThreadId, basePath);
    if (window.location.pathname === path || lastPathRef.current === path) return;
    lastPathRef.current = path;
    window.history.pushState({ agentUiThreadId: activeThreadId }, "", path);
  }, [activeThreadId, basePath, enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const onPopState = () => {
      const threadId = threadIdFromPath(window.location.pathname, basePath);
      lastPathRef.current = threadId ? threadPath(threadId, basePath) : window.location.pathname;
      if (!threadId) {
        setActiveThread(undefined);
        return;
      }
      const existingThread = threads.find((thread) => thread.thread.id === threadId);
      if (existingThread && !isPreviewUrlThread(existingThread.status)) {
        setActiveThread(threadId);
        return;
      }
      void readThread(threadId, { activate: true, includeTurns: true }).catch(() => {
        if (existingThread) setActiveThread(threadId);
        else setActiveThread(undefined);
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [basePath, enabled, readThread, setActiveThread, threads]);

}

function threadPath(threadId: string, basePath: string): string {
  const prefix = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  return `${prefix}/${encodeURIComponent(threadId)}`;
}

function threadUrlRoutingBasePath(options: AgentChatProps["threadUrlRouting"]): string {
  return typeof options === "object" && options.basePath ? options.basePath : "/threads";
}

function threadIdFromPath(pathname: string, basePath: string): string | undefined {
  const prefix = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  if (!pathname.startsWith(`${prefix}/`)) return undefined;
  const encoded = pathname.slice(prefix.length + 1).split("/")[0];
  return encoded ? decodeURIComponent(encoded) : undefined;
}

function isPreviewUrlThread(status?: string): boolean {
  return status === "notLoaded" || status === "loaded";
}

export interface AgentShellProps extends React.HTMLAttributes<HTMLElement> {
  sidebar?: React.ReactNode;
}

export function AgentShell({
  children,
  className,
  sidebar,
  ...props
}: AgentShellProps) {
  return (
    <section
      className={["aui-shell", className].filter(Boolean).join(" ")}
      data-sidebar-present={sidebar ? "true" : "false"}
      data-testid="agent-chat"
      {...props}
    >
      {sidebar}
      {children}
    </section>
  );
}
