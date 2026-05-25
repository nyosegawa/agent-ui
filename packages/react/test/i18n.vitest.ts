import { describe, expect, it } from "vitest";
import {
  agentI18nDictionaries,
  agentLocales,
  interpolationVariables,
  normalizeAgentLocale,
} from "../src/i18n";
import { en } from "../src/i18n/locales/en";
import { es } from "../src/i18n/locales/es";
import { fr } from "../src/i18n/locales/fr";
import { ja } from "../src/i18n/locales/ja";
import { ko } from "../src/i18n/locales/ko";
import { zhCN } from "../src/i18n/locales/zh-CN";
import type { AgentI18nMessages, AgentLocale } from "../src/i18n";

const localeOverrides: Record<Exclude<AgentLocale, "en">, AgentI18nMessages> = {
  es,
  fr,
  ja,
  ko,
  "zh-CN": zhCN,
};

describe("Agent UI i18n", () => {
  it("uses English as the complete source of truth for every runtime dictionary", () => {
    const englishKeys = Object.keys(en).sort();
    expect(englishKeys.length).toBeGreaterThan(200);

    for (const locale of agentLocales) {
      expect(Object.keys(agentI18nDictionaries[locale]).sort()).toEqual(englishKeys);
    }
  });

  it("keeps translated interpolation variables compatible with English", () => {
    for (const [locale, messages] of Object.entries(localeOverrides)) {
      for (const [key, message] of Object.entries(messages)) {
        expect(
          interpolationVariables(message),
          `${locale}.${key} must preserve interpolation variables from English`,
        ).toEqual(interpolationVariables(en[key as keyof typeof en]));
      }
    }
  });

  it("normalizes browser locale tags to supported Agent UI locales", () => {
    expect(normalizeAgentLocale("ja-JP")).toBe("ja");
    expect(normalizeAgentLocale("ko-KR")).toBe("ko");
    expect(normalizeAgentLocale("zh-Hans-CN")).toBe("zh-CN");
    expect(normalizeAgentLocale("es-MX")).toBe("es");
    expect(normalizeAgentLocale("fr-CA")).toBe("fr");
    expect(normalizeAgentLocale("de-DE")).toBe("en");
  });
});
