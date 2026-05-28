import type {
  AgentApp,
  AgentModel,
  ReasoningEffort,
} from "@nyosegawa/agent-ui-core";
import { selectApps } from "@nyosegawa/agent-ui-core";
import type {
  AppsListParams,
  HooksListParams,
  SkillsConfigWriteParams,
  SkillsListParams,
} from "@nyosegawa/agent-ui-codex/stable-types";
import { useCallback } from "react";
import { useAgentContext } from "../provider";
import { useCodexSession } from "./codex-session";

export function useAgentSkills(cwd?: string) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const key = cwd ?? "";
  const skills = state.skills.byCwd[key] ?? [];
  const refreshSkills = useCallback(
    async (params: SkillsListParams = {}) => {
      const requestParams = cwd && !params.cwds ? { ...params, cwds: [cwd] } : params;
      const response = await codex.skills.list(requestParams);
      const entries = normalizeSkillsList(response, cwd);
      for (const entry of entries) {
        dispatch({ cwd: entry.cwd, skills: entry.skills, type: "skills/updated" });
      }
      return entries;
    },
    [codex, cwd, dispatch],
  );
  const setSkillEnabled = useCallback(
    async (params: SkillsConfigWriteParams) => {
      const response = await codex.skills.configWrite(params);
      const targetName = stringValue(params.name);
      const targetPath = stringValue(params.path);
      const updateCwd = cwd ?? key;
      dispatch({
        cwd: updateCwd,
        skills: (state.skills.byCwd[updateCwd] ?? []).map((skill) => {
          const matches =
            (targetPath && skill.path === targetPath) ||
            (!targetPath && targetName && skill.name === targetName);
          return matches ? { ...skill, enabled: params.enabled } : skill;
        }),
        type: "skills/updated",
      });
      return response;
    },
    [codex, cwd, dispatch, key, state.skills.byCwd],
  );
  return { refreshSkills, setSkillEnabled, skills };
}

export function useAgentHooks(cwd?: string) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const key = cwd ?? "";
  const hooks = state.hooks.byCwd[key] ?? [];
  const refreshHooks = useCallback(
    async (params: HooksListParams = {}) => {
      const requestParams = cwd && !params.cwds ? { ...params, cwds: [cwd] } : params;
      const response = await codex.hooks.list(requestParams);
      const entries = normalizeHooksList(response, cwd);
      for (const entry of entries) {
        dispatch({ cwd: entry.cwd, hooks: entry.hooks, type: "hooks/updated" });
      }
      return entries;
    },
    [codex, cwd, dispatch],
  );
  return { hooks, refreshHooks };
}

export function useAgentApps(threadId?: string) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const scopedApps = selectApps(state, threadId);
  const refreshApps = useCallback(
    async (params: AppsListParams = {}) => {
      const requestParams = threadId && !params.threadId ? { ...params, threadId } : params;
      const response = await codex.apps.list(requestParams);
      const { apps, nextCursor } = normalizeAppsList(response);
      dispatch({
        apps: requestParams.cursor ? mergeApps(scopedApps.apps, apps) : apps,
        nextCursor,
        threadId: requestParams.threadId ?? undefined,
        type: "apps/updated",
      });
      return { apps, nextCursor };
    },
    [codex, dispatch, scopedApps.apps, threadId],
  );
  const loadMoreApps = useCallback(
    async () =>
      scopedApps.nextCursor ? refreshApps({ cursor: scopedApps.nextCursor }) : undefined,
    [refreshApps, scopedApps.nextCursor],
  );
  return {
    apps: scopedApps.apps,
    loadMoreApps,
    nextCursor: scopedApps.nextCursor,
    refreshApps,
  };
}

export function useAgentModels() {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const refreshModels = useCallback(async () => {
    const response = await codex.models.list();
    const models = normalizeModelList(response);
    dispatch({ models, type: "models/updated" });
    return models;
  }, [codex, dispatch]);
  return { models: state.models.models, refreshModels };
}

function normalizeModelList(response: unknown): AgentModel[] {
  const value = asRecord(response);
  const rawModels = Array.isArray(value?.data)
    ? value.data
    : Array.isArray(value?.models)
      ? value.models
      : Array.isArray(value)
        ? value
        : [];
  return rawModels
    .flatMap((model) => {
      const record = asRecord(model);
      return record ? [record] : [];
    })
    .map((model) => ({
      id: String(model.id ?? model.slug ?? model.model ?? model.name),
      defaultEffort: normalizeReasoningEffort(
        model.defaultReasoningEffort ??
          model.default_reasoning_effort ??
          model.default_effort,
      ),
      name: normalizeModelName(model),
      raw: model,
      supportedEfforts: normalizeSupportedEfforts(model),
    }));
}

function normalizeModelName(model: Record<string, unknown>): string | undefined {
  const display = model.displayName ?? model.display_name ?? model.name;
  if (typeof display === "string" && display.trim()) return display;
  const modelId = model.model ?? model.id;
  return typeof modelId === "string" && modelId.trim() ? modelId : undefined;
}

function normalizeSupportedEfforts(
  model: Record<string, unknown>,
): AgentModel["supportedEfforts"] {
  const efforts = model.supportedReasoningEfforts ?? model.supported_reasoning_efforts;
  if (!Array.isArray(efforts)) return undefined;
  const normalized = efforts
    .map((effort) => {
      if (typeof effort === "string") return effort;
      const record = asRecord(effort);
      if (!record) return undefined;
      return normalizeReasoningEffort(record.reasoningEffort ?? record.reasoning_effort);
    })
    .filter(
      (effort): effort is ReasoningEffort =>
        typeof effort === "string" && effort.length > 0,
    );
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeReasoningEffort(value: unknown): ReasoningEffort | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeSkillsList(response: unknown, fallbackCwd?: string) {
  const record = asRecord(response);
  const rawEntries = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(response)
      ? response
      : [];
  return rawEntries.flatMap((entry) => {
    const entryRecord = asRecord(entry);
    if (!entryRecord) return [];
    const cwd = stringValue(entryRecord.cwd) ?? fallbackCwd ?? "";
    const rawSkills = Array.isArray(entryRecord.skills) ? entryRecord.skills : [];
    return [
      {
        cwd,
        skills: rawSkills.flatMap((skill) => {
          const skillRecord = asRecord(skill);
          if (!skillRecord) return [];
          return [
            {
              enabled: typeof skillRecord.enabled === "boolean" ? skillRecord.enabled : undefined,
              name: String(skillRecord.name ?? ""),
              path: stringValue(skillRecord.path),
              raw: skill,
            },
          ];
        }),
      },
    ];
  });
}

function normalizeHooksList(response: unknown, fallbackCwd?: string) {
  const record = asRecord(response);
  const rawEntries = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(response)
      ? response
      : [];
  return rawEntries.flatMap((entry) => {
    const entryRecord = asRecord(entry);
    if (!entryRecord) return [];
    const cwd = stringValue(entryRecord.cwd) ?? fallbackCwd ?? "";
    const rawHooks = Array.isArray(entryRecord.hooks) ? entryRecord.hooks : [];
    return [
      {
        cwd,
        hooks: rawHooks.flatMap((hook) => {
          const hookRecord = asRecord(hook);
          if (!hookRecord) return [];
          return [
            {
              enabled: typeof hookRecord.enabled === "boolean" ? hookRecord.enabled : undefined,
              id: String(hookRecord.id ?? hookRecord.name ?? hookRecord.path),
              name: stringValue(hookRecord.name),
              raw: hook,
            },
          ];
        }),
      },
    ];
  });
}

function normalizeAppsList(response: unknown): { apps: AgentApp[]; nextCursor: string | null } {
  const record = asRecord(response);
  const rawApps = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(record?.apps)
      ? record.apps
      : Array.isArray(response)
        ? response
        : [];
  return {
    apps: rawApps.flatMap((app) => {
      const appRecord = asRecord(app);
      if (!appRecord) return [];
      return [
        {
          id: String(appRecord.id ?? appRecord.uri ?? appRecord.name),
          installed:
            typeof appRecord.installed === "boolean"
              ? appRecord.installed
              : typeof appRecord.isEnabled === "boolean"
                ? appRecord.isEnabled
                : undefined,
          name: stringValue(appRecord.name),
          needsAuth:
            typeof appRecord.needsAuth === "boolean"
              ? appRecord.needsAuth
              : appRecord.isAccessible === false,
          raw: app,
          uri: stringValue(appRecord.uri) ?? stringValue(appRecord.installUrl),
        },
      ];
    }),
    nextCursor: stringValue(record?.nextCursor) ?? stringValue(record?.next_cursor) ?? null,
  };
}

function mergeApps(current: AgentApp[], next: AgentApp[]) {
  const byId = new Map(current.map((app) => [app.id, app]));
  for (const app of next) byId.set(app.id, app);
  return Array.from(byId.values());
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
