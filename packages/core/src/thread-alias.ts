import type { AgentSessionState, ThreadId } from "./state";

export function canonicalThreadId(
  state: AgentSessionState,
  threadId: ThreadId,
): ThreadId {
  let current = threadId;
  const seen = new Set<ThreadId>();
  while (state.threadLifecycle.aliasById[current] && !seen.has(current)) {
    seen.add(current);
    current = state.threadLifecycle.aliasById[current]!;
  }
  return current;
}
