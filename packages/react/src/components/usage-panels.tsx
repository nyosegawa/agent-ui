import { useEffect, useMemo, useRef, useState } from "react";
import { IconRefresh, buttonClass } from "../components-internal";
import { useAgentApps, useAgentSkills, useAgentUsage } from "../hooks";
import { useAgentI18n, type AgentI18nKey } from "../i18n";
import { useAgentContext } from "../provider";
import { normalizeUsageWindows } from "../usage";
import { useCompactLayout } from "./shared";

export interface AgentUsageProps {
  autoRefresh?: boolean;
}

export function AgentUsagePanel({ autoRefresh = true }: AgentUsageProps = {}) {
  const { t } = useAgentI18n();
  const { state } = useAgentContext();
  const { rateLimits, refreshUsage } = useAgentUsage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const didAutoRefresh = useRef(false);
  const windows = useMemo(() => normalizeUsageWindows(rateLimits, t), [rateLimits, t]);
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
      aria-label={t("common.refresh")}
      className={buttonClass("ghost", { size: "sm" })}
      disabled={isRefreshing}
      onClick={() => {
        setIsRefreshing(true);
        void refreshUsage().finally(() => setIsRefreshing(false));
      }}
      title={t("common.refresh")}
      type="button"
    >
      <IconRefresh size={12} />
      <span>{isRefreshing ? t("common.refreshing") : t("common.refresh")}</span>
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
      <p className="aui-usage-empty">{t("usage.empty")}</p>
    );
  if (compactLayout) {
    return (
      <section className="aui-usage aui-usage-compact" aria-label={t("aria.usageLimits")}>
        <details>
          <summary>
            <strong>{t("usage.label")}</strong>
            <small>{usageSummary(windows, t)}</small>
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
    <section className="aui-usage" aria-label={t("aria.usageLimits")}>
      <div className="aui-usage-header">
        <strong>{t("usage.label")}</strong>
        {refreshButton}
      </div>
      {usageBody}
    </section>
  );
}

export function AgentUsageSummary() {
  const { t } = useAgentI18n();
  const { rateLimits } = useAgentUsage();
  const windows = useMemo(() => normalizeUsageWindows(rateLimits, t), [rateLimits, t]);
  return (
    <section className="aui-usage-summary" aria-label={t("aria.usageSummary")}>
      <strong>{t("usage.label")}</strong>
      <span>{usageSummary(windows, t)}</span>
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
  const { t } = useAgentI18n();
  return (
    <div
      aria-label={t("usage.meterLabel", { label })}
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
  const { t } = useAgentI18n();
  const inputPercent = totalTokens > 0 ? (inputTokens / totalTokens) * 100 : 0;
  const outputPercent = totalTokens > 0 ? (outputTokens / totalTokens) * 100 : 0;
  return (
    <div className="aui-token-usage" aria-label={t("aria.tokenUsage")}>
      <div className="aui-usage-row">
        <span>{t("usage.tokens")}</span>
        <strong>{totalTokens.toLocaleString()}</strong>
      </div>
      <div className="aui-meter aui-token-meter">
        <span data-kind="input" style={{ width: `${Math.max(0, inputPercent)}%` }} />
        <span data-kind="output" style={{ width: `${Math.max(0, outputPercent)}%` }} />
      </div>
      <small>
        {t("usage.inputOutput", {
          input: inputTokens.toLocaleString(),
          output: outputTokens.toLocaleString(),
        })}
      </small>
    </div>
  );
}

export function AgentSkillsPanel({ cwd }: { cwd?: string }) {
  const { t } = useAgentI18n();
  const { refreshSkills, setSkillEnabled, skills } = useAgentSkills(cwd);
  return (
    <section className="aui-skills-panel" aria-label={t("skills.label")}>
      <div className="aui-usage-header">
        <strong>{t("skills.label")}</strong>
        <button
          aria-label={t("common.refresh")}
          className={buttonClass("ghost", { size: "sm" })}
          onClick={() => void refreshSkills().catch(() => undefined)}
          title={t("common.refresh")}
          type="button"
        >
          <IconRefresh size={12} />
          <span>{t("common.refresh")}</span>
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
                {skill.enabled === false ? t("common.enable") : t("common.disable")}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="aui-usage-empty">{t("skills.empty")}</p>
      )}
    </section>
  );
}

export function AgentAppsPanel({ threadId }: { threadId?: string }) {
  const { t } = useAgentI18n();
  const { apps, loadMoreApps, nextCursor, refreshApps } = useAgentApps(threadId);
  return (
    <section className="aui-apps-panel" aria-label={t("apps.label")}>
      <div className="aui-usage-header">
        <strong>{t("apps.label")}</strong>
        <button
          aria-label={t("common.refresh")}
          className={buttonClass("ghost", { size: "sm" })}
          onClick={() => void refreshApps().catch(() => undefined)}
          title={t("common.refresh")}
          type="button"
        >
          <IconRefresh size={12} />
          <span>{t("common.refresh")}</span>
        </button>
      </div>
      {apps.length > 0 ? (
        <ul className="aui-plain-list">
          {apps.map((app) => (
            <li key={app.id}>
              <span>{app.name ?? app.id}</span>
              {app.installed === false ? <small>{t("apps.notInstalled")}</small> : null}
              {app.needsAuth ? <small>{t("apps.authNeeded")}</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="aui-usage-empty">{t("apps.empty")}</p>
      )}
      {nextCursor ? (
        <button
          className={buttonClass("subtle", { size: "sm" })}
          onClick={() => void loadMoreApps()?.catch(() => undefined)}
          type="button"
        >
          {t("apps.loadMore")}
        </button>
      ) : null}
    </section>
  );
}

function usageSummary(
  windows: ReturnType<typeof normalizeUsageWindows>,
  t: (key: AgentI18nKey) => string,
): string {
  if (windows.length === 0) return t("common.syncPending");
  return windows
    .slice(0, 3)
    .map((window) => `${window.label} ${window.valueLabel}`)
    .join(" · ");
}
