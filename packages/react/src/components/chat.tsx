import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAgentBootstrap,
  useAgentDiagnostics,
  useAgentThread,
  useAgentThreads,
  type ThreadStartOptions,
  type TurnStartOptions,
} from "../hooks";
import { useAgentChatController } from "../hooks/composer";
import {
  AgentI18nProvider,
  useAgentI18n,
  type AgentI18nMessages,
  type AgentLocale,
} from "../i18n";
import {
  AgentThreadHeader,
  AgentThreadView,
  type AgentThreadHeaderEnd,
  type AgentThreadHeaderProps,
} from "./thread";
import { AgentComposerPanel, type AgentComposerPanelProps } from "./composer";
import type {
  AgentComposerIntegration,
  AgentLocalAttachmentResolver,
} from "./composer";
import { AgentFirstRun } from "./first-run";
import type { AgentWorkingDirectoryResolver } from "./run-settings";
import { AgentThreadSidebar } from "./sidebar";
import { AgentShell, type AgentShellProps } from "./shell";
import { useCompactLayout, useContextSheetLayout } from "./shared";
import type { AgentTheme } from "./theme";
import type {
  AgentTranscriptBlock,
  AgentTranscriptEntry,
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
  type AgentStatusBarProps,
} from "./status";
import type { AgentLocalMediaUrlResolver } from "../timeline";
import { IconGauge } from "../components-internal";
import type { AgentApprovalRequest } from "../approval-types";

export interface AgentApprovalComponentProps {
  approval: AgentApprovalRequest;
  Default: React.ComponentType<AgentApprovalDefaultProps>;
}

export interface AgentApprovalDefaultProps {
  approval: AgentApprovalRequest;
}

export interface AgentItemDefaultProps {
  entry: AgentTranscriptEntry;
}

export interface AgentShellComponentProps extends AgentShellProps {
  Default: React.ComponentType<AgentShellProps>;
}

export interface AgentSidebarComponentProps extends React.ComponentProps<
  typeof AgentThreadSidebar
> {
  Default: React.ComponentType<React.ComponentProps<typeof AgentThreadSidebar>>;
}

export interface AgentEmptyStateComponentProps extends React.ComponentProps<
  typeof AgentFirstRun
> {
  Default: React.ComponentType<React.ComponentProps<typeof AgentFirstRun>>;
}

export interface AgentComposerPanelComponentProps extends AgentComposerPanelProps {
  Default: React.ComponentType<AgentComposerPanelProps>;
}

export interface AgentStatusBarComponentProps extends AgentStatusBarProps {
  Default: React.ComponentType<AgentStatusBarProps>;
}

export interface AgentThreadHeaderComponentProps extends AgentThreadHeaderProps {
  Default: React.ComponentType<AgentThreadHeaderProps>;
}

export interface AgentChatStartOptions {
  threadOptions?: ThreadStartOptions;
  turnOptions?: TurnStartOptions;
}

export interface AgentChatOverlayControls {
  contextSheetOpen?: boolean;
  onContextSheetOpenChange?: (open: boolean) => void;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  sidebarCollapsed?: boolean;
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
  Shell?: React.ComponentType<AgentShellComponentProps>;
  Sidebar?: React.ComponentType<AgentSidebarComponentProps>;
  StatusBar?: React.ComponentType<AgentStatusBarComponentProps>;
  ThreadHeader?: React.ComponentType<AgentThreadHeaderComponentProps>;
  blocks?: Partial<
    Record<AgentTranscriptBlock["kind"], React.ComponentType<AgentBlockComponentProps>>
  >;
}

export const defaultAgentComponents = {
  ComposerPanel: AgentComposerPanel,
  EmptyState: AgentFirstRun,
  Shell: AgentShell,
  Sidebar: AgentThreadSidebar,
  StatusBar: AgentStatusBar,
  ThreadHeader: AgentThreadHeader,
} satisfies AgentComponents;

export interface AgentChatProps {
  className?: string;
  composerIntegrations?: readonly AgentComposerIntegration[];
  components?: AgentComponents;
  controls?: AgentChatOverlayControls;
  diagnostics?: boolean;
  onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
  sidebar?: boolean;
  startOptions?: AgentChatStartOptions;
  statusBarEnd?: React.ReactNode;
  theme?: AgentTheme;
  threadHeaderEnd?: AgentThreadHeaderEnd;
  locale?: AgentLocale | string;
  messages?: AgentI18nMessages;
  threadUrlRouting?: boolean | AgentThreadUrlRoutingOptions;
  usage?: boolean;
}

export function AgentChat({
  className,
  composerIntegrations,
  components,
  controls,
  diagnostics = false,
  onRequestWorkingDirectory,
  resolveLocalAttachment,
  resolveLocalMediaUrl,
  sidebar = true,
  startOptions,
  statusBarEnd,
  theme,
  threadHeaderEnd,
  locale,
  messages,
  threadUrlRouting = false,
  usage = false,
}: AgentChatProps = {}) {
  return (
    <AgentI18nProvider locale={locale} messages={messages}>
      <AgentChatInner
        className={className}
        composerIntegrations={composerIntegrations}
        components={components}
        controls={controls}
        diagnostics={diagnostics}
        onRequestWorkingDirectory={onRequestWorkingDirectory}
        resolveLocalAttachment={resolveLocalAttachment}
        resolveLocalMediaUrl={resolveLocalMediaUrl}
        sidebar={sidebar}
        startOptions={startOptions}
        statusBarEnd={statusBarEnd}
        theme={theme}
        threadHeaderEnd={threadHeaderEnd}
        threadUrlRouting={threadUrlRouting}
        usage={usage}
      />
    </AgentI18nProvider>
  );
}

function AgentChatInner({
  className,
  composerIntegrations,
  components,
  controls,
  diagnostics = false,
  onRequestWorkingDirectory,
  resolveLocalAttachment,
  resolveLocalMediaUrl,
  sidebar = true,
  startOptions,
  statusBarEnd,
  theme,
  threadHeaderEnd,
  threadUrlRouting = false,
  usage = false,
}: AgentChatProps) {
  const bootstrap = useAgentBootstrap();
  const { userDiagnostics } = useAgentDiagnostics();
  const compact = useCompactLayout();
  const contextSheetLayout = useContextSheetLayout();
  const { t } = useAgentI18n();
  const { thread, threadId, startThread } = useAgentThread();
  const chatController = useAgentChatController();
  const { activeThreadId, setActiveThread } = useAgentThreads();
  useThreadUrlRouting(threadUrlRouting, activeThreadId);
  const urlRoutingEnabled = Boolean(threadUrlRouting);
  const routingBasePath = threadUrlRoutingBasePath(threadUrlRouting);
  const homePath = threadUrlRoutingHomePath(threadUrlRouting);
  // Desktop keeps an expand/collapse rail; mobile keeps an off-canvas drawer.
  // Tracking them separately means a viewport change never strands the user
  // with the wrong default.
  const [sidebarOpenDesktop, setSidebarOpenDesktop] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [contextOpenMobile, setContextOpenMobile] = useState(false);
  const chatRootRef = useRef<HTMLDivElement>(null);
  const contextRailRef = useRef<HTMLElement>(null);
  const sidebarSlotRef = useRef<HTMLDivElement>(null);
  const {
    contextSheetOpen: controlledContextSheetOpen,
    onContextSheetOpenChange,
    onSidebarCollapsedChange,
    sidebarCollapsed: controlledSidebarCollapsed,
  } = controls ?? {};
  const isSidebarCollapsed =
    controlledSidebarCollapsed ?? (compact ? !sidebarOpenMobile : !sidebarOpenDesktop);
  const setContextOpen = useCallback(
    (open: boolean) => {
      onContextSheetOpenChange?.(open);
      if (controlledContextSheetOpen === undefined) setContextOpenMobile(open);
    },
    [controlledContextSheetOpen, onContextSheetOpenChange],
  );
  const setSidebarCollapsed = useCallback(
    (next: boolean) => {
      onSidebarCollapsedChange?.(next);
      if (controlledSidebarCollapsed === undefined) {
        if (compact) setSidebarOpenMobile(!next);
        else setSidebarOpenDesktop(!next);
      }
      if (!next) setContextOpen(false);
    },
    [compact, controlledSidebarCollapsed, onSidebarCollapsedChange, setContextOpen],
  );
  const hasDiagnosticsContent =
    diagnostics &&
    (bootstrap.isBootstrapping ||
      bootstrap.errors.length > 0 ||
      userDiagnostics.banners.length > 0 ||
      userDiagnostics.errors.length > 0 ||
      userDiagnostics.warnings.length > 0);
  const hasRail = usage || hasDiagnosticsContent;
  const contextOpen = controlledContextSheetOpen ?? contextOpenMobile;
  const showRail = hasRail && (!contextSheetLayout || contextOpen);
  const drawerOpen = compact && sidebar && !isSidebarCollapsed;
  const contextSheetOpen = contextSheetLayout && hasRail && contextOpen && !drawerOpen;
  const statusEnd =
    contextSheetLayout && hasRail ? (
      <>
        <button
          aria-label={t("aria.agentContext")}
          className="aui-agent-context-trigger"
          onClick={() => {
            setSidebarCollapsed(true);
            setContextOpen(true);
          }}
          title={t("aria.agentContext")}
          type="button"
        >
          <IconGauge size={16} />
        </button>
        {statusBarEnd}
      </>
    ) : (
      statusBarEnd
    );
  const closeContextSheet = useCallback(() => {
    setContextOpen(false);
    const deferFocus =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 0);
    deferFocus(() => {
      chatRootRef.current
        ?.querySelector<HTMLButtonElement>(".aui-agent-context-trigger")
        ?.focus();
    });
  }, [setContextOpen]);
  const closeDrawer = useCallback(() => {
    setSidebarCollapsed(true);
    const deferFocus =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 0);
    deferFocus(() => {
      chatRootRef.current
        ?.querySelector<HTMLButtonElement>(".aui-threads-trigger")
        ?.focus();
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
        sidebar?.querySelector<HTMLElement>("button, a, [tabindex]:not([tabindex='-1'])");
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
  useEffect(() => {
    if (!contextSheetOpen) return;
    let cancelled = false;
    const focusSheet = () => {
      if (cancelled) return;
      contextRailRef.current?.focus();
    };
    const cancelFocus =
      typeof window.requestAnimationFrame === "function"
        ? (() => {
            const frame = window.requestAnimationFrame(focusSheet);
            return () => window.cancelAnimationFrame(frame);
          })()
        : (() => {
            const timeout = window.setTimeout(focusSheet, 0);
            return () => window.clearTimeout(timeout);
          })();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeContextSheet();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelled = true;
      cancelFocus();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeContextSheet, contextSheetOpen]);
  const componentMap = { ...defaultAgentComponents, ...components };
  const EmptyState = componentMap.EmptyState;
  const Shell = componentMap.Shell;
  const Sidebar = componentMap.Sidebar;
  const StatusBar = componentMap.StatusBar;
  const fixedWorkingDirectory =
    typeof startOptions?.threadOptions?.cwd === "string"
      ? startOptions.threadOptions.cwd
      : undefined;
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
        <div
          aria-hidden={contextSheetOpen ? "true" : undefined}
          className="aui-status-shell"
          inert={contextSheetOpen ? true : undefined}
        >
          {StatusBar ? (
            <StatusBar
              Default={AgentStatusBar}
              end={statusEnd}
              onNavigateHome={navigateHome}
              onOpenThreads={sidebar ? () => setSidebarCollapsed(false) : undefined}
            />
          ) : null}
        </div>
        <div className="aui-chat-body" data-rail={showRail ? "visible" : "hidden"}>
          <div
            aria-hidden={contextSheetOpen ? "true" : undefined}
            className="aui-thread-column"
            inert={contextSheetOpen ? true : undefined}
          >
            {thread ? (
              <AgentThreadView
                composerIntegrations={composerIntegrations}
                components={componentMap}
                resolveLocalAttachment={resolveLocalAttachment}
                resolveLocalMediaUrl={resolveLocalMediaUrl}
                threadHeaderEnd={threadHeaderEnd}
                threadId={threadId}
              />
            ) : (
              <div className="aui-empty">
                {EmptyState ? (
                  <EmptyState
                    Default={AgentFirstRun}
                    fixedWorkingDirectory={fixedWorkingDirectory}
                    onRequestWorkingDirectory={onRequestWorkingDirectory}
                    onStartThread={async (prompt) => {
                      if (prompt) await chatController.sendMessage(prompt, startOptions);
                      else await startThread(startOptions?.threadOptions);
                    }}
                  />
                ) : null}
              </div>
            )}
          </div>
          {contextSheetOpen ? (
            <button
              aria-label={t("aria.agentContext")}
              className="aui-agent-context-backdrop"
              onClick={closeContextSheet}
              type="button"
            />
          ) : null}
          {showRail ? (
            <aside
              aria-label={t("aria.agentContext")}
              className="aui-chat-rail"
              data-compact-sheet={contextSheetOpen ? "true" : undefined}
              ref={contextRailRef}
              tabIndex={contextSheetOpen ? -1 : undefined}
            >
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
