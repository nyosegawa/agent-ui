import {
  type AgentEvent,
  type AgentSessionState,
  type AgentTransport,
} from "@nyosegawa/agent-ui-core";
import {
  agentReducer,
  createInitialAgentState,
  type AgentSessionState as InternalAgentSessionState,
} from "@nyosegawa/agent-ui-core/internal";
import { AgentComposerQueueProvider } from "./composer-queue";
import { AgentComposerStateProvider } from "./composer-state";
import { AgentFirstMessageOperationProvider } from "./first-message-state";
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
  type ReactNode,
} from "react";
import { sharedReactContext } from "./context-registry";
import { useAgentTransportEvents } from "./transport-events";

export interface AgentContextValue {
  dispatch: (event: AgentEvent) => void;
  runPolicies: readonly AgentRunPolicy[];
  state: AgentSessionState;
  transport: AgentTransport;
}

interface InternalAgentContextValue {
  dispatch: (event: AgentEvent) => void;
  runPolicies: readonly AgentRunPolicy[];
  state: InternalAgentSessionState;
  transport: AgentTransport;
}

const AgentContext = sharedReactContext<InternalAgentContextValue | null>(
  "@nyosegawa/agent-ui-react/v1/AgentContext",
  null,
);

export interface AgentProviderProps {
  children?: ReactNode;
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
    const initialInternalState = initialState as unknown as
      | InternalAgentSessionState
      | undefined;
    const requestedPolicyId =
      defaultRunPolicyId ?? initialInternalState?.runSettings.policyId;
    const policyId = resolvedAgentRunPolicyId(requestedPolicyId, effectiveRunPolicies);
    if (initialInternalState) {
      return {
        ...initialInternalState,
        runSettings: {
          ...initialInternalState.runSettings,
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
      <AgentComposerStateProvider>
        <AgentFirstMessageOperationProvider>
          <AgentComposerQueueProvider sessionState={state}>
            {children}
          </AgentComposerQueueProvider>
        </AgentFirstMessageOperationProvider>
      </AgentComposerStateProvider>
    </AgentContext.Provider>
  );
}

export function useInternalAgentContext(): InternalAgentContextValue {
  const context = useContext(AgentContext);
  if (!context) throw new Error("Agent hooks must be used inside AgentProvider");
  return context;
}

export function useAgentContext(): AgentContextValue {
  return useInternalAgentContext() as unknown as AgentContextValue;
}

export function useAgentAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  return useCallback((...args: TArgs) => action(...args), [action]);
}
