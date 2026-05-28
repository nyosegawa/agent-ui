import {
  agentReducer,
  createInitialAgentState,
  type AgentEvent,
  type AgentSessionState,
  type AgentTransport,
} from "@nyosegawa/agent-ui-core";
import { AgentComposerQueueProvider } from "./composer-queue";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "react";
import { useAgentTransportEvents } from "./transport-events";

export interface AgentContextValue {
  dispatch: (event: AgentEvent) => void;
  state: AgentSessionState;
  transport: AgentTransport;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export interface AgentProviderProps extends PropsWithChildren {
  initialState?: AgentSessionState;
  transport: AgentTransport;
}

export function AgentProvider({ children, initialState, transport }: AgentProviderProps) {
  const [state, dispatch] = useReducer(
    agentReducer,
    initialState ?? createInitialAgentState(),
  );
  useAgentTransportEvents(transport, dispatch);

  const value = useMemo(() => ({ dispatch, state, transport }), [state, transport]);
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
