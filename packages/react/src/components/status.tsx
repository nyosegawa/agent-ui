import type React from "react";
import type { useAgentBootstrap } from "../hooks";
import { useAgentAccount, useAgentDiagnostics } from "../hooks";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import { IconHistory, buttonClass } from "../components-internal";
import { useAgentContext } from "../provider";
import { AgentAccountControl } from "./account-popover";
import {
  diagnosticsTitle,
  normalizedStatusNotices,
  statusDetailsSummary,
  statusSummary,
} from "./status-formatting";

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
        </button>
      ) : (
        <div className="aui-brand">
          <strong>Agent UI</strong>
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
            {state.connection.status === "connected"
              ? t("account.checking")
              : t("account.connecting")}
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
          <AgentAccountControl account={account.account} statusText={statusText} />
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
  const { userDiagnostics } = useAgentDiagnostics();
  const messages = [
    ...bootstrap.errors.map((error) => error.message),
    ...userDiagnostics.errors.map((error) => error.message),
    ...userDiagnostics.warnings.map((warning) => warning.message),
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
    <details
      className="aui-diagnostics aui-diagnostics-details"
      aria-label={t("diagnostics.label")}
    >
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

export function AgentStatusSummary() {
  const { t } = useAgentI18n();
  const { userDiagnostics } = useAgentDiagnostics();
  const notices = normalizedStatusNotices(userDiagnostics.banners);
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

export function AgentStatusDetails({
  includeCritical = false,
}: {
  includeCritical?: boolean;
}) {
  const { t } = useAgentI18n();
  const { userDiagnostics } = useAgentDiagnostics();
  const notices = normalizedStatusNotices(userDiagnostics.banners)
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
  const { userDiagnostics } = useAgentDiagnostics();
  const notices = normalizedStatusNotices(userDiagnostics.banners).filter(
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

function accountStatusLabel(status: string, t: (key: AgentI18nKey) => string): string {
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

function isSuppressedDiagnostic(message: string): boolean {
  return (
    (message.includes("codex_core_plugins::manifest") &&
      message.includes("ignoring interface.defaultPrompt")) ||
    (message.includes("codex_core_skills::loader") &&
      (message.includes("ignoring interface.icon_small") ||
        message.includes("ignoring interface.icon_large")))
  );
}
