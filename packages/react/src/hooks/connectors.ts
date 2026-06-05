import { useCallback } from "react";
import { useAgentContext } from "../provider";
import {
  codexHooksListParams,
  codexSkillsConfigWriteParams,
  codexSkillsListParams,
  type AgentHooksRefreshOptions,
  type AgentSkillConfigWriteOptions,
  type AgentSkillsRefreshOptions,
} from "../request-options";
import { useCodexSession } from "./codex-session";

export type {
  AgentHooksRefreshOptions,
  AgentSkillConfigWriteOptions,
  AgentSkillsRefreshOptions,
} from "../request-options";

export function useAgentSkills(cwd?: string) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const key = cwd ?? "";
  const skills = state.skills.byCwd[key] ?? [];
  const refreshSkills = useCallback(
    async (params: AgentSkillsRefreshOptions = {}) => {
      const requestOptions = cwd && !params.cwds ? { ...params, cwds: [cwd] } : params;
      const response = await codex.skills.list(codexSkillsListParams(requestOptions));
      const entries = normalizeSkillsList(response, cwd);
      for (const entry of entries) {
        dispatch({ cwd: entry.cwd, skills: entry.skills, type: "skills/updated" });
      }
      return entries;
    },
    [codex, cwd, dispatch],
  );
  const setSkillEnabled = useCallback(
    async (params: AgentSkillConfigWriteOptions) => {
      const response = await codex.skills.configWrite(
        codexSkillsConfigWriteParams(params),
      );
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
    async (params: AgentHooksRefreshOptions = {}) => {
      const requestOptions = cwd && !params.cwds ? { ...params, cwds: [cwd] } : params;
      const response = await codex.hooks.list(codexHooksListParams(requestOptions));
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
          const id =
            stringValue(hookRecord.key) ??
            stringValue(hookRecord.id) ??
            stringValue(hookRecord.name) ??
            stringValue(hookRecord.path);
          if (!id) return [];
          return [
            {
              cwd,
              enabled: typeof hookRecord.enabled === "boolean" ? hookRecord.enabled : undefined,
              id,
              name: stringValue(hookRecord.name),
            },
          ];
        }),
      },
    ];
  });
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
