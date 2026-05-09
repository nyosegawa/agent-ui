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
  useRef,
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
  const warningSequence = useRef(0);

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
        if (event.message) {
          for (const [index, message] of normalizeTransportMessages(
            event.message,
          ).entries()) {
            dispatch({
              type: "warning/added",
              warning: {
                id: `stderr-${warningSequence.current++}-${index}`,
                message,
              },
            });
          }
        }
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

function normalizeTransportMessages(message: string): string[] {
  return message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(formatTransportMessage);
}

function formatTransportMessage(message: string): string {
  try {
    const parsed = JSON.parse(message) as {
      fields?: { message?: unknown; path?: unknown };
      level?: unknown;
      target?: unknown;
    };
    const text =
      typeof parsed.fields?.message === "string" ? parsed.fields.message : message;
    const level = typeof parsed.level === "string" ? parsed.level : undefined;
    const target = typeof parsed.target === "string" ? parsed.target : undefined;
    const path = typeof parsed.fields?.path === "string" ? parsed.fields.path : undefined;
    return [level, target, text, path ? `(${path})` : undefined]
      .filter(Boolean)
      .join(" ");
  } catch {
    return message;
  }
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
