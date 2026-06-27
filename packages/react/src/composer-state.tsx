import {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import { sharedReactContext } from "./context-registry";

export interface AgentComposerDraftState {
  error?: string;
  isInterrupting: boolean;
  isSubmitting: boolean;
  value: string;
}

interface AgentComposerStateStore {
  getSnapshot: (scopeKey: string) => AgentComposerDraftState;
  setState: (
    scopeKey: string,
    update: SetStateAction<AgentComposerDraftState>,
  ) => void;
  subscribe: (scopeKey: string, listener: () => void) => () => void;
}

const defaultComposerState: AgentComposerDraftState = {
  error: undefined,
  isInterrupting: false,
  isSubmitting: false,
  value: "",
};

const AgentComposerStateContext = sharedReactContext<AgentComposerStateStore | null>(
  "@nyosegawa/agent-ui-react/v1/AgentComposerStateContext",
  null,
);

export function AgentComposerStateProvider({ children }: PropsWithChildren) {
  const stateRef = useRef(new Map<string, AgentComposerDraftState>());
  const listenersRef = useRef(new Map<string, Set<() => void>>());
  const store = useMemo<AgentComposerStateStore>(
    () => ({
      getSnapshot(scopeKey) {
        return stateRef.current.get(scopeKey) ?? defaultComposerState;
      },
      setState(scopeKey, update) {
        const previous = stateRef.current.get(scopeKey) ?? defaultComposerState;
        const next =
          typeof update === "function"
            ? (update as (state: AgentComposerDraftState) => AgentComposerDraftState)(
                previous,
              )
            : update;
        if (Object.is(previous, next)) return;
        stateRef.current.set(scopeKey, next);
        for (const listener of listenersRef.current.get(scopeKey) ?? []) listener();
      },
      subscribe(scopeKey, listener) {
        const listeners = listenersRef.current.get(scopeKey) ?? new Set<() => void>();
        listeners.add(listener);
        listenersRef.current.set(scopeKey, listeners);
        return () => {
          listeners.delete(listener);
          if (listeners.size === 0) listenersRef.current.delete(scopeKey);
        };
      },
    }),
    [],
  );
  return (
    <AgentComposerStateContext.Provider value={store}>
      {children}
    </AgentComposerStateContext.Provider>
  );
}

export function useAgentComposerDraftState(scopeKey: string) {
  const store = useContext(AgentComposerStateContext);
  if (!store) throw new Error("Agent hooks must be used inside AgentProvider");
  const state = useSyncExternalStore(
    useCallback((listener) => store.subscribe(scopeKey, listener), [scopeKey, store]),
    useCallback(() => store.getSnapshot(scopeKey), [scopeKey, store]),
    useCallback(() => store.getSnapshot(scopeKey), [scopeKey, store]),
  );
  const setState = useCallback<Dispatch<SetStateAction<AgentComposerDraftState>>>(
    (update) => store.setState(scopeKey, update),
    [scopeKey, store],
  );
  return [state, setState] as const;
}

