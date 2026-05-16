import type React from "react";
import type {
  AgentItemState,
  PendingServerRequest,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import { useCallback, useState } from "react";
import { useAgentBootstrap, useAgentThread, useAgentThreads } from "../hooks";
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
  usage?: boolean;
}

export function AgentChat({
  className,
  diagnostics = false,
  onRequestAppMention,
  onRequestPluginMention,
  resolveLocalAttachment,
  sidebar = true,
  slots,
  usage = false,
}: AgentChatProps = {}) {
  const bootstrap = useAgentBootstrap();
  const compact = useCompactLayout();
  const { thread, threadId, startThread } = useAgentThread();
  const { threads, activeThreadId, setActiveThread } = useAgentThreads();
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
