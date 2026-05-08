import {
  agentReducer,
  createInitialAgentState,
  type AgentEvent,
  type AgentSessionState,
  type AgentTransport,
} from "@nyosegawa/agent-ui-core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "react";

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

  useEffect(() => {
    let cancelled = false;
    void transport.connect().catch((error: unknown) => {
      dispatch({
        error: { message: error instanceof Error ? error.message : String(error) },
        type: "connection/error",
      });
    });
    void (async () => {
      for await (const event of transport.events) {
        if (cancelled) break;
        if (event.event) dispatch(event.event);
        if (event.error) dispatch({ error: event.error, type: "error/added" });
      }
    })();
    return () => {
      cancelled = true;
      void transport.close();
    };
  }, [transport]);

  const value = useMemo(() => ({ dispatch, state, transport }), [state, transport]);
  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
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
