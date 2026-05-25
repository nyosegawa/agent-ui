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

export const agentI18nDictionaries: Record<AgentLocale, AgentI18nDictionary> = {
  en,
  es: withEnglishFallback(es),
  fr: withEnglishFallback(fr),
  ja: withEnglishFallback(ja),
  ko: withEnglishFallback(ko),
  "zh-CN": withEnglishFallback(zhCN),
};
