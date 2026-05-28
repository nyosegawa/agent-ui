import type { AgentModel, ReasoningEffort } from "@nyosegawa/agent-ui-core";
import { useCallback } from "react";
import { useAgentContext } from "../provider";
import { useCodexSession } from "./codex-session";

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
      : Array.isArray(response)
        ? response
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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}
