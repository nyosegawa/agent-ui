import { useEffect, useMemo, useRef, useState } from "react";
import type { useAgentBootstrap } from "../hooks";
import { useAgentApps, useAgentAuth, useAgentSkills, useAgentUsage } from "../hooks";
import { IconHistory, IconRefresh, buttonClass } from "../components-internal";
import { useAgentContext } from "../provider";
import { normalizeUsageWindows } from "../usage";
import { useCompactLayout } from "./shared";

export function AgentStatusBar({
  onOpenThreads,
}: {
  onOpenThreads?: () => void;
} = {}) {
  const { state } = useAgentContext();
  const { account, cancelLogin, login } = useAgentAuth();
  const accountLabel = accountLabelText(account.account);
  const statusText =
    account.status === "unknown"
      ? state.connection.status === "connected"
        ? "checking account"
        : "connecting"
      : account.status;
  return (
    <header className="aui-status">
      {onOpenThreads ? (
        <button
          aria-label="Open thread history"
          className="aui-threads-trigger"
          onClick={onOpenThreads}
          title="Threads"
          type="button"
        >
          <IconHistory size={16} />
          <span>Threads</span>
        </button>
      ) : null}
      <div className="aui-brand">
        <strong>Agent UI</strong>
        <span>{accountLabel ? `${statusText} · ${accountLabel}` : statusText}</span>
      </div>
      {account.login ? (
        <div className="aui-login-code" role="status">
          {account.login.verificationUrl ? (
            <a href={account.login.verificationUrl} rel="noreferrer" target="_blank">
              Open device login
            </a>
          ) : null}
          {account.login.userCode ? <code>{account.login.userCode}</code> : null}
          {account.login.loginId ? (
            <button
              className={buttonClass("secondary", { size: "sm" })}
              onClick={() => void cancelLogin()}
              type="button"
            >
              Cancel login
            </button>
          ) : null}
        </div>
      ) : null}
      {account.status === "unknown" ? (
        <button
          className={buttonClass("secondary", { size: "sm" })}
          disabled
          type="button"
        >
          {state.connection.status === "connected" ? "Checking" : "Connecting"}
        </button>
      ) : null}
      {account.status === "unauthenticated" ? (
        <button
          className={buttonClass("primary", { size: "sm" })}
          onClick={() => void login()}
          type="button"
        >
          Login
        </button>
      ) : null}
    </header>
  );
}

function accountLabelText(
  account: Record<string, unknown> | undefined,
): string | undefined {
  if (!account) return undefined;
  const email = typeof account.email === "string" ? account.email : undefined;
  const planType = typeof account.planType === "string" ? account.planType : undefined;
  if (email && planType) return `${email} (${planType})`;
  return email ?? planType;
}

export function AgentDiagnosticsPanel({
  bootstrap,
}: {
  bootstrap: ReturnType<typeof useAgentBootstrap>;
}) {
  const { state } = useAgentContext();
  const messages = [
    ...bootstrap.errors.map((error) => error.message),
    ...state.errors.map((error) => error.message),
    ...state.configWarnings.map((warning) => warning.message),
  ].filter((message) => message && !isSuppressedDiagnostic(message));
  if (bootstrap.isBootstrapping && messages.length === 0) {
    return (
      <section className="aui-diagnostics" aria-label="Diagnostics">
        <span>Syncing account, models, and usage.</span>
      </section>
    );
  }
  if (messages.length === 0) return null;
  const title = diagnosticsTitle(messages);
  return (
    <details className="aui-diagnostics aui-diagnostics-details" aria-label="Diagnostics">
      <summary>
        <span>{title}</span>
        <small>
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </small>
      </summary>
      <div>
        {messages.slice(-8).map((message, index) => (
          <span key={`${message}-${index}`}>{message}</span>
        ))}
      </div>
    </details>
  );
}

export const AgentDiagnostics = AgentDiagnosticsPanel;

type AgentStatusSeverity = "info" | "warning" | "critical";

interface AgentStatusNotice {
  id: string;
  kind: string;
  message: string;
  severity: AgentStatusSeverity;
  title: string;
}

export function AgentStatusSummary() {
  const { state } = useAgentContext();
  const notices = normalizedStatusNotices(state.diagnostics.banners);
  if (notices.length === 0) return null;
  const criticalCount = notices.filter((notice) => notice.severity === "critical").length;
  const warningCount = notices.filter((notice) => notice.severity === "warning").length;
  return (
    <section className="aui-status-summary" aria-label="Status summary">
      <strong>Status</strong>
      <span>{statusSummary(notices.length, warningCount, criticalCount)}</span>
    </section>
  );
}

export function AgentStatusDetails({ includeCritical = false }: { includeCritical?: boolean }) {
  const { state } = useAgentContext();
  const notices = normalizedStatusNotices(state.diagnostics.banners)
    .filter((notice) => includeCritical || notice.severity !== "critical")
    .slice(-6);
  if (notices.length === 0) return null;
  return (
    <section className="aui-status-banners" aria-label="Status details">
      <details>
        <summary>
          <strong>Details</strong>
          <span>{statusDetailsSummary(notices)}</span>
        </summary>
        <div className="aui-status-banner-list">
          {notices.map((notice) => (
            <article
              className="aui-status-banner"
              data-kind={notice.kind}
              data-severity={notice.severity}
              key={notice.id}
            >
              <strong>{notice.title}</strong>
              <span>{notice.message}</span>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}

export const AgentStatusDrawer = AgentStatusDetails;
export const AgentStatusBanners = AgentStatusDetails;

export function AgentCriticalNoticeList() {
  const { state } = useAgentContext();
  const notices = normalizedStatusNotices(state.diagnostics.banners).filter(
    (notice) => notice.severity === "critical",
  );
  if (notices.length === 0) return null;
  return (
    <section className="aui-critical-banners" aria-label="Critical status">
      {notices.slice(-2).map((notice) => (
        <article
          className="aui-critical-banner"
          data-kind={notice.kind}
          data-severity={notice.severity}
          key={notice.id}
        >
          <strong>{notice.title}</strong>
          <span>{notice.message}</span>
        </article>
      ))}
    </section>
  );
}

export function normalizedStatusNotices(
  banners: Array<{ id: string; kind: string; message: string }>,
): AgentStatusNotice[] {
  return banners.map((banner) => ({
    id: banner.id,
    kind: banner.kind,
    message: banner.message,
    severity: statusSeverity(banner.kind, banner.message),
    title: statusBannerTitle(banner.kind),
  }));
}

function statusSeverity(kind: string, message: string): AgentStatusSeverity {
  if (kind === "rateLimit") return rateLimitSeverity(message);
  if (kind === "configWarning" || kind === "deprecationNotice") return "warning";
  if (/failed|blocked|danger|requires action|needs action/i.test(message)) {
    return "critical";
  }
  return "info";
}

function rateLimitSeverity(message: string): AgentStatusSeverity {
  if (/below (the )?warning threshold|normal|available|ready/i.test(message)) {
    return "info";
  }
  if (
    /exceeded|blocked|at (the )?limit|reached|0\s*remaining|100\s*%|99\s*%|98\s*%|97\s*%|96\s*%|95\s*%/i.test(
      message,
    )
  ) {
    return "critical";
  }
  if (/warning|near|approach|80\s*%|85\s*%|90\s*%|91\s*%|92\s*%|93\s*%|94\s*%/i.test(message)) {
    return "warning";
  }
  return "info";
}

export function statusSummary(total: number, warningCount: number, criticalCount: number): string {
  if (criticalCount > 0) {
    return `${criticalCount} critical · ${warningCount} warning · ${total} total`;
  }
  if (warningCount > 0) {
    return `${warningCount} warning · ${total} total`;
  }
  return `${total} background ${total === 1 ? "notice" : "notices"}`;
}

function statusDetailsSummary(notices: AgentStatusNotice[]): string {
  const warningCount = notices.filter((notice) => notice.severity === "warning").length;
  if (warningCount > 0) return `${warningCount} warning · ${notices.length} notices`;
  return `${notices.length} background ${notices.length === 1 ? "notice" : "notices"}`;
}

export interface AgentUsageProps {
  autoRefresh?: boolean;
}

export function AgentUsagePanel({ autoRefresh = true }: AgentUsageProps = {}) {
  const { state } = useAgentContext();
  const { rateLimits, refreshUsage } = useAgentUsage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const didAutoRefresh = useRef(false);
  const windows = useMemo(() => normalizeUsageWindows(rateLimits), [rateLimits]);
  const compactLayout = useCompactLayout();
  useEffect(() => {
    if (
      autoRefresh &&
      state.connection.status === "connected" &&
      !didAutoRefresh.current
    ) {
      didAutoRefresh.current = true;
      void refreshUsage().catch(() => undefined);
    }
  }, [autoRefresh, refreshUsage, state.connection.status]);
  const refreshButton = (
    <button
      aria-label="Refresh"
      className={buttonClass("ghost", { size: "sm" })}
      disabled={isRefreshing}
      onClick={() => {
        setIsRefreshing(true);
        void refreshUsage().finally(() => setIsRefreshing(false));
      }}
      title="Refresh usage"
      type="button"
    >
      <IconRefresh size={12} />
      <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
    </button>
  );
  const usageBody =
    windows.length > 0 ? (
      <div className="aui-usage-grid">
        {windows.map((window) => (
          <div className="aui-usage-window" key={window.id}>
            <div className="aui-usage-row">
              <span>{window.label}</span>
              <strong>{window.valueLabel}</strong>
            </div>
            <AgentRateLimitBar label={window.label} percent={window.percent} />
            {window.resetLabel ? <small>{window.resetLabel}</small> : null}
          </div>
        ))}
      </div>
    ) : (
      <p className="aui-usage-empty">Usage limits are available after account sync.</p>
    );
  if (compactLayout) {
    return (
      <section className="aui-usage aui-usage-compact" aria-label="Usage limits">
        <details>
          <summary>
            <strong>Usage</strong>
            <small>{usageSummary(windows)}</small>
          </summary>
          <div className="aui-usage-compact-body">
            <div className="aui-usage-header">{refreshButton}</div>
            {usageBody}
          </div>
        </details>
      </section>
    );
  }
  return (
    <section className="aui-usage" aria-label="Usage limits">
      <div className="aui-usage-header">
        <strong>Usage</strong>
        {refreshButton}
      </div>
      {usageBody}
    </section>
  );
}

export const AgentUsage = AgentUsagePanel;

export function AgentUsageSummary() {
  const { rateLimits } = useAgentUsage();
  const windows = useMemo(() => normalizeUsageWindows(rateLimits), [rateLimits]);
  return (
    <section className="aui-usage-summary" aria-label="Usage summary">
      <strong>Usage</strong>
      <span>{usageSummary(windows)}</span>
    </section>
  );
}

export function AgentRateLimitBar({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  return (
    <div
      aria-label={`${label} usage`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(percent)}
      className="aui-meter"
      role="progressbar"
    >
      <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

export function AgentTokenUsageBar({
  inputTokens = 0,
  outputTokens = 0,
  totalTokens = inputTokens + outputTokens,
}: {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}) {
  const inputPercent = totalTokens > 0 ? (inputTokens / totalTokens) * 100 : 0;
  const outputPercent = totalTokens > 0 ? (outputTokens / totalTokens) * 100 : 0;
  return (
    <div className="aui-token-usage" aria-label="Token usage">
      <div className="aui-usage-row">
        <span>Tokens</span>
        <strong>{totalTokens.toLocaleString()}</strong>
      </div>
      <div className="aui-meter aui-token-meter">
        <span data-kind="input" style={{ width: `${Math.max(0, inputPercent)}%` }} />
        <span data-kind="output" style={{ width: `${Math.max(0, outputPercent)}%` }} />
      </div>
      <small>
        {inputTokens.toLocaleString()} input · {outputTokens.toLocaleString()} output
      </small>
    </div>
  );
}

export function AgentSkillsPanel({ cwd }: { cwd?: string }) {
  const { refreshSkills, setSkillEnabled, skills } = useAgentSkills(cwd);
  return (
    <section className="aui-skills-panel" aria-label="Skills">
      <div className="aui-usage-header">
        <strong>Skills</strong>
        <button
          aria-label="Refresh"
          className={buttonClass("ghost", { size: "sm" })}
          onClick={() => void refreshSkills().catch(() => undefined)}
          title="Refresh skills"
          type="button"
        >
          <IconRefresh size={12} />
          <span>Refresh</span>
        </button>
      </div>
      {skills.length > 0 ? (
        <ul className="aui-plain-list">
          {skills.map((skill) => (
            <li key={`${skill.path ?? ""}:${skill.name}`}>
              <span>{skill.name}</span>
              <button
                className={buttonClass("subtle", { size: "sm" })}
                onClick={() =>
                  void setSkillEnabled({
                    enabled: skill.enabled === false,
                    ...(skill.path ? { path: skill.path } : { name: skill.name }),
                  }).catch(() => undefined)
                }
                type="button"
              >
                {skill.enabled === false ? "Enable" : "Disable"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="aui-usage-empty">Skills are available after refresh.</p>
      )}
    </section>
  );
}

export function AgentAppsPanel({ threadId }: { threadId?: string }) {
  const { apps, loadMoreApps, nextCursor, refreshApps } = useAgentApps(threadId);
  return (
    <section className="aui-apps-panel" aria-label="Apps">
      <div className="aui-usage-header">
        <strong>Apps</strong>
        <button
          aria-label="Refresh"
          className={buttonClass("ghost", { size: "sm" })}
          onClick={() => void refreshApps().catch(() => undefined)}
          title="Refresh apps"
          type="button"
        >
          <IconRefresh size={12} />
          <span>Refresh</span>
        </button>
      </div>
      {apps.length > 0 ? (
        <ul className="aui-plain-list">
          {apps.map((app) => (
            <li key={app.id}>
              <span>{app.name ?? app.id}</span>
              {app.installed === false ? <small>not installed</small> : null}
              {app.needsAuth ? <small>auth needed</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="aui-usage-empty">Apps are available after refresh.</p>
      )}
      {nextCursor ? (
        <button
          className={buttonClass("subtle", { size: "sm" })}
          onClick={() => void loadMoreApps()?.catch(() => undefined)}
          type="button"
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}


function usageSummary(windows: ReturnType<typeof normalizeUsageWindows>): string {
  if (windows.length === 0) return "sync pending";
  return windows
    .slice(0, 3)
    .map((window) => `${window.label} ${window.valueLabel}`)
    .join(" · ");
}


function diagnosticsTitle(messages: string[]): string {
  const pluginWarnings = messages.filter((message) =>
    message.includes("codex_core_plugins::manifest"),
  ).length;
  if (pluginWarnings === messages.length) return "Plugin manifest warnings";
  if (pluginWarnings > 0) return "Diagnostics and plugin warnings";
  return "Diagnostics";
}


function statusBannerTitle(kind: string): string {
  switch (kind) {
    case "modelReroute":
      return "Model rerouted";
    case "deprecationNotice":
      return "Deprecation notice";
    case "configWarning":
      return "Config warning";
    case "accountStatus":
      return "Account";
    case "mcpOAuth":
      return "MCP OAuth";
    case "rateLimit":
      return "Rate limit";
    default:
      return "Status";
  }
}


function isSuppressedDiagnostic(message: string): boolean {
  return (
    (message.includes("codex_core_plugins::manifest") &&
      message.includes("ignoring interface.defaultPrompt")) ||
    (message.includes("codex_core_skills::loader") &&
      (message.includes("ignoring interface.icon_small") ||
        message.includes("ignoring interface.icon_large")))
  );
}

