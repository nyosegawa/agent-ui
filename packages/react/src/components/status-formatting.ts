import type { AgentI18nKey } from "../i18n";

export type AgentStatusSeverity = "info" | "warning" | "critical";

export interface AgentStatusNotice {
  id: string;
  kind: string;
  message: string;
  severity: AgentStatusSeverity;
  title: string;
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

export function statusDetailsSummary(
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

export function diagnosticsTitle(messages: string[]): string {
  const pluginWarnings = messages.filter((message) =>
    message.includes("codex_core_plugins::manifest"),
  ).length;
  if (pluginWarnings === messages.length) {
    return fallbackStatusT("diagnostics.pluginManifestWarnings");
  }
  if (pluginWarnings > 0) return fallbackStatusT("diagnostics.withPluginWarnings");
  return fallbackStatusT("diagnostics.label");
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

function fallbackStatusT(
  key: AgentI18nKey,
  vars?: Record<string, string | number>,
): string {
  const fallback: Partial<Record<AgentI18nKey, string>> = {
    "account.authenticated": "authenticated",
    "account.authenticating": "authenticating",
    "account.unauthenticated": "unauthenticated",
    "common.notice": "notice",
    "common.notices": "notices",
    "diagnostics.label": "Diagnostics",
    "diagnostics.pluginManifestWarnings": "Plugin manifest warnings",
    "diagnostics.withPluginWarnings": "Diagnostics and plugin warnings",
    "status.account": "Account",
    "status.backgroundNotice": "{count} background {label}",
    "status.configWarning": "Config warning",
    "status.critical": "critical",
    "status.deprecationNotice": "Deprecation notice",
    "status.mcpOAuth": "MCP OAuth",
    "status.modelReroute": "Model rerouted",
    "status.rateLimit": "Rate limit",
    "status.title": "Status",
    "status.total": "total",
    "status.warning": "warning",
  };
  const template = fallback[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => String(vars?.[name] ?? match));
}
