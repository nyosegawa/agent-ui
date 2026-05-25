import type { AgentI18nDictionary, AgentI18nMessages, AgentLocale } from "../types";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { ja } from "./ja";
import { ko } from "./ko";
import { zhCN } from "./zh-CN";

function withEnglishFallback(overrides: AgentI18nMessages): AgentI18nDictionary {
  return { ...en, ...overrides };
}

export { en } from "./en";
export { es } from "./es";
export { fr } from "./fr";
export { ja } from "./ja";
export { ko } from "./ko";
export { zhCN } from "./zh-CN";

export const agentI18nDictionaries: Record<AgentLocale, AgentI18nDictionary> = {
  en,
  es: withEnglishFallback(es),
  fr: withEnglishFallback(fr),
  ja: withEnglishFallback(ja),
  ko: withEnglishFallback(ko),
  "zh-CN": withEnglishFallback(zhCN),
};
