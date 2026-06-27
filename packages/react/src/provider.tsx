import {
  agentReducer,
  createInitialAgentState,
  type AgentEvent,
  type AgentSessionState,
  type AgentTransport,
} from "@nyosegawa/agent-ui-core";
import { AgentComposerQueueProvider } from "./composer-queue";
import {
  DEFAULT_AGENT_RUN_POLICIES,
  effectiveAgentRunPolicies,
  resolvedAgentRunPolicyId,
  type AgentRunPolicy,
  type AgentRunPolicyId,
} from "./run-policies";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "react";
import { sharedReactContext } from "./context-registry";
import { useAgentTransportEvents } from "./transport-events";

export interface AgentContextValue {
  dispatch: (event: AgentEvent) => void;
  runPolicies: readonly AgentRunPolicy[];
  state: AgentSessionState;
  transport: AgentTransport;
}

const AgentContext = sharedReactContext<AgentContextValue | null>(
  "@nyosegawa/agent-ui-react/v1/AgentContext",
  null,
);

export interface AgentProviderProps extends PropsWithChildren {
  defaultRunPolicyId?: AgentRunPolicyId;
  initialState?: AgentSessionState;
  runPolicies?: readonly AgentRunPolicy[];
  transport: AgentTransport;
}

export function AgentProvider({
  children,
  defaultRunPolicyId,
  initialState,
  runPolicies = DEFAULT_AGENT_RUN_POLICIES,
  transport,
}: AgentProviderProps) {
  const effectiveRunPolicies = useMemo(
    () => effectiveAgentRunPolicies(runPolicies),
    [runPolicies],
  );
  const initialSessionState = useMemo(() => {
    const requestedPolicyId = defaultRunPolicyId ?? initialState?.runSettings.policyId;
    const policyId = resolvedAgentRunPolicyId(requestedPolicyId, effectiveRunPolicies);
    if (initialState) {
      return {
        ...initialState,
        runSettings: {
          ...initialState.runSettings,
          ...(policyId ? { policyId } : {}),
        },
      };
    }
    const state = createInitialAgentState();
    if (policyId) {
      state.runSettings = { ...state.runSettings, policyId };
    }
    return state;
  }, [defaultRunPolicyId, effectiveRunPolicies, initialState]);
  const [state, dispatch] = useReducer(agentReducer, initialSessionState);
  useAgentTransportEvents(transport, dispatch);
  useEffect(() => {
    const policyId = resolvedAgentRunPolicyId(
      state.runSettings.policyId,
      effectiveRunPolicies,
    );
    if (policyId && policyId !== state.runSettings.policyId) {
      dispatch({ policyId, type: "runSettings/updated" });
    }
  }, [effectiveRunPolicies, state.runSettings.policyId]);

  const value = useMemo(
    () => ({ dispatch, runPolicies: effectiveRunPolicies, state, transport }),
    [effectiveRunPolicies, state, transport],
  );
  return (
    <AgentContext.Provider value={value}>
      <AgentComposerQueueProvider sessionState={state}>
        {children}
      </AgentComposerQueueProvider>
    </AgentContext.Provider>
  );
}

export function useAgentContext(): AgentContextValue {
  const context = useContext(AgentContext);
  if (!context) throw new Error("Agent hooks must be used inside AgentProvider");
  return context;
}

export function useAgentAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  return useCallback((...args: TArgs) => action(...args), [action]);
}
