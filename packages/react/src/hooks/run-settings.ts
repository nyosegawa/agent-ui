import {
  selectRunSettings,
  type AgentModel,
  type ReasoningEffort,
} from "@nyosegawa/agent-ui-core";
import { useCallback } from "react";
import { useAgentContext } from "../provider";
import {
  effectiveAgentRunPolicies,
  type AgentRunPolicyId,
} from "../run-policies";

export type { TurnStartOptions } from "../request-options";
export {
  AGENT_FULL_ACCESS_RUN_POLICY,
  DEFAULT_AGENT_RUN_POLICIES,
  agentRunPolicyTurnOptions,
  effectiveAgentRunPolicies,
  resolvedAgentRunPolicyId,
  type AgentRunPolicy,
  type AgentRunPolicyId,
} from "../run-policies";

export function useAgentRunSettings() {
  const { dispatch, runPolicies, state } = useAgentContext();
  const runSettings = selectRunSettings(state);
  const policies = effectiveAgentRunPolicies(runPolicies);
  const selectedPolicy =
    policies.find((policy) => policy.id === runSettings.policyId) ?? policies[0];
  const selectedModel =
    state.models.models.find((model) => model.id === runSettings.modelId) ??
    state.models.models.find((model) => isDefaultModel(model));
  const supportedEfforts =
    selectedModel?.supportedEfforts && selectedModel.supportedEfforts.length > 0
      ? selectedModel.supportedEfforts
      : [];

  const setPolicyId = useCallback(
    (policyId: AgentRunPolicyId) =>
      dispatch({ policyId, type: "runSettings/updated" }),
    [dispatch],
  );
  const setModelId = useCallback(
    (modelId: string) => {
      const model = state.models.models.find((candidate) => candidate.id === modelId);
      dispatch({
        effort: model?.defaultEffort,
        modelId: modelId || undefined,
        type: "runSettings/updated",
      });
    },
    [dispatch, state.models.models],
  );
  const setEffort = useCallback(
    (effort: ReasoningEffort) =>
      dispatch({ effort: effort || undefined, type: "runSettings/updated" }),
    [dispatch],
  );

  return {
    models: state.models.models,
    policies,
    runSettings,
    selectedModel,
    selectedPolicy,
    setEffort,
    setModelId,
    setPolicyId,
    supportedEfforts,
  };
}

function isDefaultModel(model: AgentModel): boolean {
  return model.isDefault === true;
}
