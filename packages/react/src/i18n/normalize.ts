import type { AgentLocale } from "./types";

export function normalizeAgentLocale(locale?: AgentLocale | string): AgentLocale {
  const candidate =
    locale ??
    (typeof navigator !== "undefined" && typeof navigator.language === "string"
      ? navigator.language
      : "en");
  const normalized = candidate.toLowerCase();
  if (normalized === "zh" || normalized === "zh-cn" || normalized.startsWith("zh-hans")) {
    return "zh-CN";
  }
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  return "en";
}
