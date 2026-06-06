import type React from "react";
import type {
  AgentThreadView as AgentThreadViewModel,
  AgentItemState,
  PendingServerRequest,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import { selectThreadView } from "@nyosegawa/agent-ui-core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAgentBootstrap,
  useAgentThread,
  useAgentThreads,
} from "../hooks";
import { useAgentContext } from "../provider";
import { useInternalAgentComposerController } from "../hooks/composer";
import {
  AgentI18nProvider,
  useAgentI18n,
  type AgentI18nMessages,
  type AgentLocale,
} from "../i18n";
import { AgentThreadView } from "./thread";
import {
  AgentComposerPanel,
  type AgentComposerPanelProps,
} from "./composer";
import type {
  AgentComposerMentionResolver,
  AgentLocalAttachmentResolver,
} from "./composer";
import { AgentFirstRun } from "./first-run";
import type { AgentWorkingDirectoryResolver } from "./run-settings";
import { AgentThreadSidebar } from "./sidebar";
import { useCompactLayout } from "./shared";
import type { AgentTheme } from "./theme";
import type {
  AgentTranscriptBlock,
  AgentTranscriptItem,
} from "../hooks/transcript";
import {
  threadPath,
  threadUrlRoutingBasePath,
  threadUrlRoutingHomePath,
  useThreadUrlRouting,
  type AgentThreadUrlRoutingOptions,
} from "./thread-url-routing";
import {
  AgentDiagnosticsPanel,
  AgentStatusBar,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentUsagePanel,
} from "./status";
import type { AgentLocalMediaUrlResolver } from "../timeline";

export interface AgentApprovalComponentProps {
  approval: PendingServerRequest;
  Default: React.ComponentType<AgentApprovalDefaultProps>;
}

export interface AgentApprovalDefaultProps {
  approval: PendingServerRequest;
}

export interface AgentItemComponentProps {
  Default: React.ComponentType<AgentItemDefaultProps>;
  item: AgentItemState;
  turn: TurnState;
}

export interface AgentItemDefaultProps {
  item: AgentItemState;
  turn: TurnState;
}

export interface AgentShellComponentProps extends AgentShellProps {
  Default: React.ComponentType<AgentShellProps>;
}

export interface AgentSidebarComponentProps
  extends React.ComponentProps<typeof AgentThreadSidebar> {
  Default: React.ComponentType<React.ComponentProps<typeof AgentThreadSidebar>>;
}

export interface AgentEmptyStateComponentProps
  extends React.ComponentProps<typeof AgentFirstRun> {
  Default: React.ComponentType<React.ComponentProps<typeof AgentFirstRun>>;
}

export interface AgentComposerPanelComponentProps extends AgentComposerPanelProps {
  Default: React.ComponentType<AgentComposerPanelProps>;
}

export interface AgentBlockDefaultProps {
  block: AgentTranscriptBlock;
  item?: AgentTranscriptItem;
}

export interface AgentBlockComponentProps extends AgentBlockDefaultProps {
  Default: React.ComponentType<AgentBlockDefaultProps>;
}

export interface AgentComponents {
  Approval?: React.ComponentType<AgentApprovalComponentProps>;
  ComposerPanel?: React.ComponentType<AgentComposerPanelComponentProps>;
  EmptyState?: React.ComponentType<AgentEmptyStateComponentProps>;
  Item?: React.ComponentType<AgentItemComponentProps>;
  Shell?: React.ComponentType<AgentShellComponentProps>;
  Sidebar?: React.ComponentType<AgentSidebarComponentProps>;
  blocks?: Partial<
    Record<AgentTranscriptBlock["kind"], React.ComponentType<AgentBlockComponentProps>>
  >;
}

export const defaultAgentComponents = {
  ComposerPanel: AgentComposerPanel,
  EmptyState: AgentFirstRun,
  Shell: AgentShell,
  Sidebar: AgentThreadSidebar,
} satisfies AgentComponents;

export interface AgentChatProps {
  className?: string;
  components?: AgentComponents;
  diagnostics?: boolean;
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  sidebar?: boolean;
  statusBarEnd?: React.ReactNode;
  theme?: AgentTheme;
  locale?: AgentLocale | string;
  messages?: AgentI18nMessages;
  threadUrlRouting?: boolean | AgentThreadUrlRoutingOptions;
  usage?: boolean;
}

export function AgentChat({
  className,
  components,
  diagnostics = false,
  onRequestAppMention,
  onRequestWorkingDirectory,
  onRequestPluginMention,
  resolveLocalAttachment,
  resolveLocalMediaUrl,
  sidebar = true,
  statusBarEnd,
  theme,
  locale,
  messages,
  threadUrlRouting = false,
  usage = false,
}: AgentChatProps = {}) {
  return (
    <AgentI18nProvider locale={locale} messages={messages}>
      <AgentChatInner
        className={className}
        components={components}
        diagnostics={diagnostics}
        onRequestAppMention={onRequestAppMention}
        onRequestPluginMention={onRequestPluginMention}
        onRequestWorkingDirectory={onRequestWorkingDirectory}
        resolveLocalAttachment={resolveLocalAttachment}
        resolveLocalMediaUrl={resolveLocalMediaUrl}
        sidebar={sidebar}
        statusBarEnd={statusBarEnd}
        theme={theme}
        threadUrlRouting={threadUrlRouting}
        usage={usage}
      />
    </AgentI18nProvider>
  );
}

function AgentChatInner({
  className,
  components,
  diagnostics = false,
  onRequestAppMention,
  onRequestWorkingDirectory,
  onRequestPluginMention,
  resolveLocalAttachment,
  resolveLocalMediaUrl,
  sidebar = true,
  statusBarEnd,
  theme,
  threadUrlRouting = false,
  usage = false,
}: AgentChatProps) {
  const bootstrap = useAgentBootstrap();
  const compact = useCompactLayout();
  const { t } = useAgentI18n();
  const { thread, threadId, startThread } = useAgentThread();
  const composer = useInternalAgentComposerController();
  const { threads, activeThreadId, setActiveThread } = useAgentThreads();
  const { state } = useAgentContext();
  const sidebarThreads: AgentThreadViewModel[] = threads.flatMap((thread) => {
    const view = selectThreadView(state, thread.id);
    return view ? [view] : [];
  });
  useThreadUrlRouting(threadUrlRouting, activeThreadId);
  const urlRoutingEnabled = Boolean(threadUrlRouting);
  const routingBasePath = threadUrlRoutingBasePath(threadUrlRouting);
  const homePath = threadUrlRoutingHomePath(threadUrlRouting);
  // Desktop keeps an expand/collapse rail; mobile keeps an off-canvas drawer.
  // Tracking them separately means a viewport change never strands the user
  // with the wrong default.
  const [sidebarOpenDesktop, setSidebarOpenDesktop] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const chatRootRef = useRef<HTMLDivElement>(null);
  const sidebarSlotRef = useRef<HTMLDivElement>(null);
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
  const closeDrawer = useCallback(() => {
    setSidebarCollapsed(true);
    const deferFocus =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 0);
    deferFocus(() => {
      chatRootRef.current?.querySelector<HTMLButtonElement>(".aui-threads-trigger")?.focus();
    });
  }, [setSidebarCollapsed]);
  useEffect(() => {
    if (!drawerOpen) return;
    let cancelled = false;
    const focusDrawer = () => {
      if (cancelled) return;
      const sidebar = sidebarSlotRef.current?.querySelector<HTMLElement>(".aui-sidebar");
      const target =
        sidebar?.querySelector<HTMLElement>("input") ??
        sidebar?.querySelector<HTMLElement>(
          "button, a, [tabindex]:not([tabindex='-1'])",
        );
      target?.focus();
    };
    const cancelFocus =
      typeof window.requestAnimationFrame === "function"
        ? (() => {
            const frame = window.requestAnimationFrame(focusDrawer);
            return () => window.cancelAnimationFrame(frame);
          })()
        : (() => {
            const timeout = window.setTimeout(focusDrawer, 0);
            return () => window.clearTimeout(timeout);
          })();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelled = true;
      cancelFocus();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDrawer, drawerOpen]);
  const componentMap = { ...defaultAgentComponents, ...components };
  const EmptyState = componentMap.EmptyState;
  const Shell = componentMap.Shell;
  const Sidebar = componentMap.Sidebar;
  const navigateHome = useCallback(() => {
    setActiveThread(undefined);
    if (compact) setSidebarOpenMobile(false);
    if (!urlRoutingEnabled || typeof window === "undefined") return;
    if (window.location.pathname !== homePath) {
      window.history.pushState({ agentUiHome: true }, "", homePath);
    }
  }, [compact, homePath, setActiveThread, urlRoutingEnabled]);
  const navigateToThread = useCallback(
    (nextThreadId: string) => {
      setActiveThread(nextThreadId);
      if (!urlRoutingEnabled || typeof window === "undefined") return;
      const path = threadPath(nextThreadId, routingBasePath);
      if (window.location.pathname !== path) {
        window.history.pushState({ agentUiThreadId: nextThreadId }, "", path);
      }
    },
    [routingBasePath, setActiveThread, urlRoutingEnabled],
  );
  return (
    <Shell
      Default={AgentShell}
      className={className}
      data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
      data-sidebar-drawer={drawerOpen ? "open" : "closed"}
      sidebar={
        sidebar && Sidebar ? (
          <div className="aui-sidebar-slot" ref={sidebarSlotRef}>
            <Sidebar
              Default={AgentThreadSidebar}
              activeThreadId={activeThreadId}
              collapsed={isSidebarCollapsed}
              onCreateThread={navigateHome}
              onCollapsedChange={setSidebarCollapsed}
              onSelectThread={navigateToThread}
              threads={sidebarThreads}
            />
          </div>
        ) : undefined
      }
      theme={theme}
    >
      {drawerOpen ? (
        <button
          aria-label={t("aria.dismissThreadHistory")}
          className="aui-sidebar-backdrop"
          onClick={closeDrawer}
          type="button"
        />
      ) : null}
      <div
        aria-hidden={drawerOpen ? "true" : undefined}
        className="aui-chat"
        inert={drawerOpen ? true : undefined}
        ref={chatRootRef}
      >
        <AgentStatusBar
          end={statusBarEnd}
          onNavigateHome={navigateHome}
          onOpenThreads={sidebar ? () => setSidebarCollapsed(false) : undefined}
        />
        <div className="aui-chat-body" data-rail={hasRail ? "visible" : "hidden"}>
          <div className="aui-thread-column">
            {thread ? (
              <AgentThreadView
                onRequestAppMention={onRequestAppMention}
                onRequestPluginMention={onRequestPluginMention}
                components={componentMap}
                resolveLocalAttachment={resolveLocalAttachment}
                resolveLocalMediaUrl={resolveLocalMediaUrl}
                threadId={threadId}
              />
            ) : (
              <div className="aui-empty">
                {EmptyState ? (
                  <EmptyState
                    Default={AgentFirstRun}
                    onRequestWorkingDirectory={onRequestWorkingDirectory}
                    onStartThread={async (prompt) => {
                      if (prompt) await composer.startWithMessage(prompt);
                      else await startThread();
                    }}
                  />
                ) : null}
              </div>
            )}
          </div>
          {hasRail ? (
            <aside className="aui-chat-rail" aria-label={t("aria.agentContext")}>
              <AgentStatusSummary />
              <AgentStatusDetails />
              {usage ? <AgentUsagePanel autoRefresh={false} /> : null}
              {diagnostics ? <AgentDiagnosticsPanel bootstrap={bootstrap} /> : null}
            </aside>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

export interface AgentShellProps extends React.HTMLAttributes<HTMLElement> {
  sidebar?: React.ReactNode;
  theme?: AgentTheme;
}

export function AgentShell({
  children,
  className,
  sidebar,
  theme,
  ...props
}: AgentShellProps) {
  const { Default: _Default, ...htmlProps } = props as typeof props & {
    Default?: unknown;
  };
  void _Default;
  const inheritedTheme = (props as { "data-aui-theme"?: AgentTheme })["data-aui-theme"];
  return (
    <section
      className={["aui-shell", className].filter(Boolean).join(" ")}
      data-sidebar-present={sidebar ? "true" : "false"}
      data-testid="agent-chat"
      {...htmlProps}
      data-aui-theme={theme ?? inheritedTheme}
    >
      {sidebar}
      {children}
    </section>
  );
}
