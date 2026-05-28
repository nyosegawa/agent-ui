import type React from "react";
import type { useAgentBootstrap } from "../hooks";
import { useAgentAccount, useAgentDiagnostics } from "../hooks";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import { IconHistory, buttonClass } from "../components-internal";
import { useAgentContext } from "../provider";
import { AgentAccountControl } from "./account-popover";

export {
  AgentAppsPanel,
  AgentRateLimitBar,
  AgentSkillsPanel,
  AgentTokenUsageBar,
  AgentUsagePanel,
  AgentUsageSummary,
  type AgentUsageProps,
} from "./usage-panels";

export function AgentStatusBar({
  end,
  onNavigateHome,
  onOpenThreads,
}: {
  end?: React.ReactNode;
  onNavigateHome?: () => void;
  onOpenThreads?: () => void;
} = {}) {
  const { t } = useAgentI18n();
  const { state } = useAgentContext();
  const { account, cancelLogin, login } = useAgentAccount();
  const statusText =
    account.status === "unknown"
      ? state.connection.status === "connected"
        ? t("account.checking")
        : t("account.connecting")
      : accountStatusLabel(account.status, t);
  return (
    <header className="aui-status">
      {onOpenThreads ? (
        <button
          aria-label={t("thread.openHistory")}
          className="aui-threads-trigger"
          onClick={onOpenThreads}
          title={t("thread.history")}
          type="button"
        >
          <IconHistory size={16} />
          <span>{t("thread.history")}</span>
        </button>
      ) : null}
      {onNavigateHome ? (
        <button
          aria-label={t("firstRun.form")}
          className="aui-brand aui-brand-action"
          onClick={onNavigateHome}
          type="button"
        >
          <strong>Agent UI</strong>
          <span>{statusText}</span>
        </button>
      ) : (
        <div className="aui-brand">
          <strong>Agent UI</strong>
          <span>{statusText}</span>
        </div>
      )}
      <div className="aui-status-actions">
        {end}
        {account.login ? (
          <div className="aui-login-code" role="status">
            {account.login.verificationUrl ? (
              <a href={account.login.verificationUrl} rel="noreferrer" target="_blank">
                {t("account.openDeviceLogin")}
              </a>
            ) : null}
            {account.login.userCode ? <code>{account.login.userCode}</code> : null}
            {account.login.loginId ? (
              <button
                className={buttonClass("secondary", { size: "sm" })}
                onClick={() => void cancelLogin()}
                type="button"
              >
                {t("account.cancelLogin")}
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
            {state.connection.status === "connected" ? t("account.checking") : t("account.connecting")}
          </button>
        ) : null}
        {account.status === "unauthenticated" ? (
          <button
            className={buttonClass("primary", { size: "sm" })}
            onClick={() => void login()}
            type="button"
          >
            {t("account.login")}
          </button>
        ) : null}
        {account.status === "authenticated" ? (
          <AgentAccountControl
            account={account.account}
            statusText={statusText}
          />
        ) : null}
      </div>
    </header>
  );
}

export function AgentDiagnosticsPanel({
  bootstrap,
}: {
  bootstrap: ReturnType<typeof useAgentBootstrap>;
}) {
  const { t } = useAgentI18n();
  const { errors, warnings } = useAgentDiagnostics();
  const messages = [
    ...bootstrap.errors.map((error) => error.message),
    ...errors.map((error) => error.message),
    ...warnings.map((warning) => warning.message),
  ].filter((message) => message && !isSuppressedDiagnostic(message));
  if (bootstrap.isBootstrapping && messages.length === 0) {
    return (
      <section className="aui-diagnostics" aria-label={t("diagnostics.label")}>
        <span>{t("diagnostics.syncing")}</span>
      </section>
    );
  }
  if (messages.length === 0) return null;
  const title = diagnosticsTitle(messages);
  return (
    <details className="aui-diagnostics aui-diagnostics-details" aria-label={t("diagnostics.label")}>
      <summary>
        <span>{title}</span>
        <small>
          {t("diagnostics.messageCount", {
            count: messages.length,
            label: messages.length === 1 ? t("common.message") : t("common.messages"),
          })}
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

type AgentStatusSeverity = "info" | "warning" | "critical";

interface AgentStatusNotice {
  id: string;
  kind: string;
  message: string;
  severity: AgentStatusSeverity;
  title: string;
}

export function AgentStatusSummary() {
  const { t } = useAgentI18n();
  const { banners } = useAgentDiagnostics();
  const notices = normalizedStatusNotices(banners);
  if (notices.length === 0) return null;
  const criticalCount = notices.filter((notice) => notice.severity === "critical").length;
  const warningCount = notices.filter((notice) => notice.severity === "warning").length;
  return (
    <section className="aui-status-summary" aria-label={t("aria.statusSummary")}>
      <strong>{t("status.title")}</strong>
      <span>{statusSummary(notices.length, warningCount, criticalCount, t)}</span>
    </section>
  );
}

export function AgentStatusDetails({ includeCritical = false }: { includeCritical?: boolean }) {
  const { t } = useAgentI18n();
  const { banners } = useAgentDiagnostics();
  const notices = normalizedStatusNotices(banners)
    .filter((notice) => includeCritical || notice.severity !== "critical")
    .slice(-6);
  if (notices.length === 0) return null;
  return (
    <section className="aui-status-banners" aria-label={t("aria.statusDetails")}>
      <details>
        <summary>
          <strong>{t("common.details")}</strong>
          <span>{statusDetailsSummary(notices, t)}</span>
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

export function AgentCriticalNoticeList() {
  const { t } = useAgentI18n();
  const { banners } = useAgentDiagnostics();
  const notices = normalizedStatusNotices(banners).filter(
    (notice) => notice.severity === "critical",
  );
  if (notices.length === 0) return null;
  return (
    <section className="aui-critical-banners" aria-label={t("aria.criticalStatus")}>
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
  banners: Array<{
    id: string;
    kind: string;
    message: string;
    raw?: unknown;
    severity?: AgentStatusSeverity;
  }>,
): AgentStatusNotice[] {
  const t = defaultStatusTitle;
  return banners.map((banner) => ({
    id: banner.id,
    kind: banner.kind,
    message: banner.message,
    severity: statusSeverity(banner),
    title: t(banner.kind),
  }));
}

function statusSeverity(banner: {
  kind: string;
  message: string;
  raw?: unknown;
  severity?: AgentStatusSeverity;
}): AgentStatusSeverity {
  const explicit = explicitSeverity(banner.severity ?? recordString(banner.raw, "severity"));
  if (explicit) return explicit;
  const kind = banner.kind;
  const message = banner.message;
  if (kind === "rateLimit") return rateLimitSeverity(banner.raw, message);
  if (kind === "configWarning" || kind === "deprecationNotice") return "warning";
  if (/failed|blocked|danger|requires action|needs action/i.test(message)) {
    return "critical";
  }
  return "info";
}

function rateLimitSeverity(raw: unknown, message: string): AgentStatusSeverity {
  const structured = structuredRateLimitSeverity(raw);
  if (structured) return structured;
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

function structuredRateLimitSeverity(raw: unknown): AgentStatusSeverity | undefined {
  const snapshots = collectRateLimitSnapshots(raw);
  const percents = snapshots.flatMap((snapshot) => {
    const record = asRecord(snapshot);
    if (!record) return [];
    if (record.rateLimitReachedType ?? record.rate_limit_reached_type) return [100];
    return ["primary", "secondary"].flatMap((key) => {
      const window = asRecord(record[key]);
      if (!window) return [];
      const percent =
        numberValue(window.usedPercent ?? window.used_percent) ?? percentFromUsedLimit(window);
      return percent === undefined ? [] : [percent];
    });
  });
  if (percents.some((percent) => percent >= 95)) return "critical";
  if (percents.some((percent) => percent >= 80)) return "warning";
  if (percents.length > 0) return "info";
  return undefined;
}

function collectRateLimitSnapshots(value: unknown): unknown[] {
  const record = asRecord(value);
  if (!record) return [];
  const snapshots: unknown[] = [];
  if (record.rateLimits) snapshots.push(record.rateLimits);
  if (record.rate_limits) snapshots.push(record.rate_limits);
  const byId = asRecord(record.rateLimitsByLimitId ?? record.rate_limits_by_limit_id);
  if (byId) snapshots.push(...Object.values(byId));
  if (record.primary || record.secondary) snapshots.push(record);
  return snapshots;
}

function explicitSeverity(value: unknown): AgentStatusSeverity | undefined {
  return value === "info" || value === "warning" || value === "critical" ? value : undefined;
}

function recordString(value: unknown, key: string): string | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const field = record[key];
  return typeof field === "string" ? field : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function percentFromUsedLimit(window: Record<string, unknown>) {
  const used = numberValue(window.used);
  const limit = numberValue(window.limit);
  if (used === undefined || !limit) return undefined;
  return (used / limit) * 100;
}

export function statusSummary(
  total: number,
  warningCount: number,
  criticalCount: number,
  t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string = fallbackStatusT,
): string {
  if (criticalCount > 0) {
    return `${criticalCount} ${t("status.critical")} · ${warningCount} ${t("status.warning")} · ${total} ${t("status.total")}`;
  }
  if (warningCount > 0) {
    return `${warningCount} ${t("status.warning")} · ${total} ${t("status.total")}`;
  }
  return t("status.backgroundNotice", {
    count: total,
    label: total === 1 ? t("common.notice") : t("common.notices"),
  });
}

function statusDetailsSummary(
  notices: AgentStatusNotice[],
  t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string,
): string {
  const warningCount = notices.filter((notice) => notice.severity === "warning").length;
  if (warningCount > 0) {
    return `${warningCount} ${t("status.warning")} · ${notices.length} ${
      notices.length === 1 ? t("common.notice") : t("common.notices")
    }`;
  }
  return t("status.backgroundNotice", {
    count: notices.length,
    label: notices.length === 1 ? t("common.notice") : t("common.notices"),
  });
}

function diagnosticsTitle(messages: string[]): string {
  const pluginWarnings = messages.filter((message) =>
    message.includes("codex_core_plugins::manifest"),
  ).length;
  if (pluginWarnings === messages.length) return fallbackStatusT("diagnostics.pluginManifestWarnings");
  if (pluginWarnings > 0) return fallbackStatusT("diagnostics.withPluginWarnings");
  return fallbackStatusT("diagnostics.label");
}

function defaultStatusTitle(kind: string): string {
  switch (kind) {
    case "modelReroute":
      return fallbackStatusT("status.modelReroute");
    case "deprecationNotice":
      return fallbackStatusT("status.deprecationNotice");
    case "configWarning":
      return fallbackStatusT("status.configWarning");
    case "accountStatus":
      return fallbackStatusT("status.account");
    case "mcpOAuth":
      return fallbackStatusT("status.mcpOAuth");
    case "rateLimit":
      return fallbackStatusT("status.rateLimit");
    default:
      return fallbackStatusT("status.title");
  }
}

function accountStatusLabel(
  status: string,
  t: (key: AgentI18nKey) => string,
): string {
  switch (status) {
    case "authenticated":
      return t("account.authenticated");
    case "authenticating":
      return t("account.authenticating");
    case "unauthenticated":
      return t("account.unauthenticated");
    default:
      return status;
  }
}

function fallbackStatusT(key: AgentI18nKey): string {
  const fallback: Partial<Record<AgentI18nKey, string>> = {
    "account.authenticated": "authenticated",
    "account.authenticating": "authenticating",
    "account.unauthenticated": "unauthenticated",
    "diagnostics.label": "Diagnostics",
    "diagnostics.pluginManifestWarnings": "Plugin manifest warnings",
    "diagnostics.withPluginWarnings": "Diagnostics and plugin warnings",
    "status.account": "Account",
    "status.configWarning": "Config warning",
    "status.deprecationNotice": "Deprecation notice",
    "status.mcpOAuth": "MCP OAuth",
    "status.modelReroute": "Model rerouted",
    "status.rateLimit": "Rate limit",
    "status.title": "Status",
  };
  return fallback[key] ?? key;
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
