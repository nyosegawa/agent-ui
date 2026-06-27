import { useContext, useMemo } from "react";
import { sharedReactContext } from "../context-registry";
import { interpolate } from "./interpolate";
import { agentI18nDictionaries } from "./locales";
import { normalizeAgentLocale } from "./normalize";
import type { AgentI18nProviderProps, AgentI18nValue } from "./types";

const AgentI18nContext = sharedReactContext<AgentI18nValue | null>(
  "@nyosegawa/agent-ui-react/v1/AgentI18nContext",
  null,
);

export function AgentI18nProvider({
  children,
  locale,
  messages,
}: AgentI18nProviderProps) {
  const normalizedLocale = normalizeAgentLocale(locale);
  const value = useMemo<AgentI18nValue>(() => {
    const dictionary = {
      ...agentI18nDictionaries.en,
      ...agentI18nDictionaries[normalizedLocale],
      ...messages,
    };
    return {
      locale: normalizedLocale,
      t: (key, vars) => interpolate(dictionary[key] ?? agentI18nDictionaries.en[key], vars),
    };
  }, [messages, normalizedLocale]);
  return (
    <AgentI18nContext.Provider value={value}>{children}</AgentI18nContext.Provider>
  );
}

const defaultI18n: AgentI18nValue = {
  locale: "en",
  t: (key, vars) => interpolate(agentI18nDictionaries.en[key], vars),
};

export function useAgentI18n(): AgentI18nValue {
  return useContext(AgentI18nContext) ?? defaultI18n;
}
