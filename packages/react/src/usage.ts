import type { AgentI18nKey } from "./i18n";
import { interpolate } from "./i18n/interpolate";
import { en } from "./i18n/locales/en";

export interface UsageWindow {
  id: string;
  label: string;
  percent: number;
  resetLabel?: string;
  valueLabel: string;
}

type UsageTranslator = (key: AgentI18nKey, vars?: Record<string, string | number>) => string;

export function normalizeUsageWindows(
  rateLimits: unknown,
  t: UsageTranslator = fallbackUsageT,
): UsageWindow[] {
  const snapshots = collectRateLimitSnapshots(rateLimits);
  const windows = snapshots.flatMap((snapshot, snapshotIndex) => {
    const record = asRecord(snapshot);
    if (!record) return [];
    const limitName =
      stringValue(record.limitName) ??
      stringValue(record.limitId) ??
      stringValue(record.limit_id) ??
      t("usage.label");
    return ["primary", "secondary"].flatMap((key) => {
      const window = asRecord(record[key]);
      if (!window) return [];
      const label = usageWindowLabel(limitName, key, window, t);
      const percent =
        numberValue(window.usedPercent ?? window.used_percent) ?? percentFromUsedLimit(window);
      return [
        {
          id: `${snapshotIndex}-${key}`,
          label,
          percent,
          resetLabel: resetLabel(window, t),
          valueLabel: usageValueLabel(window, percent),
        },
      ];
    });
  });
  return dedupeUsageWindows(windows);
}

function dedupeUsageWindows(windows: UsageWindow[]): UsageWindow[] {
  const seen = new Set<string>();
  return windows.filter((window) => {
    const key = `${window.label}:${window.resetLabel ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectRateLimitSnapshots(value: unknown): unknown[] {
  const record = asRecord(value);
  if (!record) return [];
  const snapshots: unknown[] = [];
  const rateLimits = record.rateLimits ?? record.rate_limits;
  if (rateLimits) snapshots.push(rateLimits);
  const byId = asRecord(
    record.rateLimitsByLimitId ?? record.rate_limits_by_limit_id,
  );
  if (byId) snapshots.push(...Object.values(byId));
  if (record.primary || record.secondary) snapshots.push(record);
  return snapshots;
}

function usageWindowLabel(
  limitName: string,
  key: string,
  window: Record<string, unknown>,
  t: UsageTranslator,
) {
  const mins = numberValue(window.windowDurationMins ?? window.window_duration_mins);
  if (mins && mins >= 60 * 24 * 6) return t("usage.weeklyWindow", { name: limitName });
  if (mins && mins >= 60) {
    return t("usage.hourWindow", { name: limitName, hours: Math.round(mins / 60) });
  }
  return t("usage.namedWindow", { name: limitName, key });
}

function usageValueLabel(window: Record<string, unknown>, percent: number) {
  const used = numberValue(window.used);
  const limit = numberValue(window.limit);
  if (used !== undefined && limit !== undefined) return `${used}/${limit}`;
  return `${Math.round(percent)}%`;
}

function percentFromUsedLimit(window: Record<string, unknown>) {
  const used = numberValue(window.used);
  const limit = numberValue(window.limit);
  if (used === undefined || !limit) return 0;
  return (used / limit) * 100;
}

function resetLabel(window: Record<string, unknown>, t: UsageTranslator) {
  const reset = window.resetsAt ?? window.resetAt ?? window.resets_at ?? window.reset_at;
  if (typeof reset === "number") {
    const millis = reset > 1_000_000_000_000 ? reset : reset * 1000;
    return t("usage.resetAt", { time: new Date(millis).toLocaleString() });
  }
  if (typeof reset === "string") {
    return t("usage.resetAt", { time: new Date(reset).toLocaleString() });
  }
  return undefined;
}

function fallbackUsageT(key: AgentI18nKey, vars?: Record<string, string | number>) {
  return interpolate(en[key], vars);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}
