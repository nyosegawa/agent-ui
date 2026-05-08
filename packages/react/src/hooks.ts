import {
  selectActiveThread,
  selectOrderedThreads,
  selectOrderedTurns,
  selectPendingApprovals,
  selectRunSettings,
  selectThread,
  type AgentModel,
  type ExecutionModeId,
  type ReasoningEffort,
  type RequestId,
  type ThreadId,
} from "@nyosegawa/agent-ui-core";
import { useCallback, useMemo, useState } from "react";
import { useAgentContext } from "./provider";
import { threadSnapshotEvents, threadUpsertEvent } from "./thread-history";

export interface AgentExecutionMode {
  id: ExecutionModeId;
  label: string;
  description: string;
  turnParams: Record<string, unknown>;
}

export const AGENT_EXECUTION_MODES: AgentExecutionMode[] = [
  {
    description: "Ask before commands or file changes that need review.",
    id: "review",
    label: "Review",
    turnParams: {
      approvalPolicy: "on-request",
      sandboxPolicy: { excludeSlashTmp: false, excludeTmpdirEnvVar: false, networkAccess: false, type: "workspaceWrite", writableRoots: [] },
    },
  },
  {
    description: "Run in the workspace and ask only after a command fails.",
    id: "auto",
    label: "Auto",
    turnParams: {
      approvalPolicy: "on-failure",
      sandboxPolicy: { excludeSlashTmp: false, excludeTmpdirEnvVar: false, networkAccess: false, type: "workspaceWrite", writableRoots: [] },
    },
  },
  {
    description: "Read files and plan changes without writing to the workspace.",
    id: "read-only",
    label: "Read-only",
    turnParams: {
      approvalPolicy: "untrusted",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
    },
  },
  {
    description: "Allow full local access for trusted one-off work.",
    id: "full-access",
    label: "Full access",
    turnParams: {
      approvalPolicy: "never",
      sandboxPolicy: { type: "dangerFullAccess" },
    },
  },
];

const DEFAULT_EFFORTS: ReasoningEffort[] = ["minimal", "low", "medium", "high", "xhigh"];

export function useAgentThread(threadId?: ThreadId) {
  const { dispatch, state, transport } = useAgentContext();
  const resolvedThreadId = threadId ?? state.activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : selectActiveThread(state);
  const turns = resolvedThreadId ? selectOrderedTurns(state, resolvedThreadId) : [];

  const startThread = useCallback(
    async (params?: Record<string, unknown>) => {
      const result = await transport.request<Record<string, unknown> | undefined, any>(
        "thread/start",
        params,
      );
      const rawThread = result.thread ?? result;
      dispatch({
        status: rawThread.status ?? result.status,
        thread: {
          ephemeral: rawThread.ephemeral,
          id: String(rawThread.id ?? rawThread.threadId),
          name: rawThread.name,
          path: rawThread.path,
          raw: rawThread,
        },
        type: "thread/started",
      });
      return result;
    },
    [dispatch, transport],
  );

  const resumeThread = useCallback(
    async (id: ThreadId, params?: Record<string, unknown>) => {
      const result = await transport.request<Record<string, unknown>, any>("thread/resume", {
        ...params,
        threadId: id,
      });
      const rawThread = result?.thread;
      if (rawThread) {
        dispatch({
          status: rawThread.status ?? result.status ?? "loaded",
          thread: {
            ephemeral: rawThread.ephemeral,
            id: String(rawThread.id ?? rawThread.threadId ?? id),
            name: rawThread.name,
            path: rawThread.path,
            raw: rawThread,
          },
          type: "thread/started",
        });
      }
      dispatch({ threadId: id, type: "thread/active/set" });
      return result;
    },
    [dispatch, transport],
  );

  return { resumeThread, startThread, thread, threadId: resolvedThreadId, turns };
}

export function useAgentThreads() {
  const { dispatch, state } = useAgentContext();
  const threads = useMemo(() => selectOrderedThreads(state), [state]);
  const setActiveThread = useCallback(
    (threadId: ThreadId) => dispatch({ threadId, type: "thread/active/set" }),
    [dispatch],
  );
  return { activeThreadId: state.activeThreadId, setActiveThread, threads };
}

export interface ThreadHistoryParams {
  cursor?: string | null;
  limit?: number;
  searchTerm?: string;
}

export function useAgentThreadHistory() {
  const { dispatch, state, transport } = useAgentContext();
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>();
  const [error, setError] = useState<Error | undefined>();

  const listThreads = useCallback(
    async (params: ThreadHistoryParams = {}) => {
      setIsLoading(true);
      setError(undefined);
      try {
        const response = await transport.request<Record<string, unknown>, any>("thread/list", {
          cursor: params.cursor ?? null,
          limit: params.limit ?? 25,
          searchTerm: params.searchTerm || null,
          sortDirection: "desc",
          sortKey: "updated_at",
        });
        const rawThreads = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.threads)
            ? response.threads
            : [];
        for (const rawThread of rawThreads) {
          dispatch(threadUpsertEvent(rawThread));
        }
        setCursor(response?.nextCursor ?? response?.next_cursor ?? null);
        return response;
      } catch (caught) {
        const nextError = caught instanceof Error ? caught : new Error(String(caught));
        setError(nextError);
        throw nextError;
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, transport],
  );

  return {
    cursor,
    error,
    isLoading,
    listThreads,
    threads: selectOrderedThreads(state),
  };
}

export function useAgentThreadReader() {
  const { dispatch, transport } = useAgentContext();
  const readThread = useCallback(
    async (
      threadId: ThreadId,
      options: { activate?: boolean; includeTurns?: boolean } = {},
    ) => {
      const response = await transport.request<Record<string, unknown>, any>("thread/read", {
        includeTurns: options.includeTurns ?? true,
        threadId,
      });
      const rawThread = response?.thread ?? response;
      for (const event of threadSnapshotEvents(rawThread, options.activate ?? true)) {
        dispatch(event);
      }
      return response;
    },
    [dispatch, transport],
  );
  return { readThread };
}

export function useAgentTurn(threadId?: ThreadId) {
  const { state, transport } = useAgentContext();
  const resolvedThreadId = threadId ?? state.activeThreadId;
  const runSettings = selectRunSettings(state);

  const startTurn = useCallback(
    async (input: string, params?: Record<string, unknown>) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      const executionMode = AGENT_EXECUTION_MODES.find(
        (mode) => mode.id === runSettings.executionMode,
      );
      return transport.request("turn/start", {
        ...(executionMode?.turnParams ?? {}),
        ...(runSettings.modelId ? { model: runSettings.modelId } : {}),
        ...(runSettings.effort ? { effort: runSettings.effort } : {}),
        ...params,
        input: [{ text: input, text_elements: [], type: "text" }],
        threadId: resolvedThreadId,
      });
    },
    [resolvedThreadId, runSettings.effort, runSettings.executionMode, runSettings.modelId, transport],
  );

  const interruptTurn = useCallback(
    async (turnId: string) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      return transport.request("turn/interrupt", { threadId: resolvedThreadId, turnId });
    },
    [resolvedThreadId, transport],
  );

  return { interruptTurn, startTurn };
}

export function useAgentApprovals(threadId?: ThreadId) {
  const { dispatch, state, transport } = useAgentContext();
  const approvals = useMemo(
    () => selectPendingApprovals(state, threadId),
    [state, threadId],
  );

  const approve = useCallback(
    async (requestId: RequestId, result: unknown = { decision: "approved" }) => {
      await transport.respond(requestId, result);
      dispatch({ requestId, type: "serverRequest/resolved" });
    },
    [dispatch, transport],
  );

  const reject = useCallback(
    async (requestId: RequestId, message = "Rejected by user") => {
      const error = { code: -32000, message };
      await transport.reject(requestId, error);
      dispatch({ error, requestId, type: "serverRequest/rejected" });
    },
    [dispatch, transport],
  );

  return { approvals, approve, reject };
}

export function useAgentComposer(threadId?: ThreadId) {
  const [value, setValue] = useState("");
  const { startTurn } = useAgentTurn(threadId);
  const submit = useCallback(async () => {
    const input = value.trim();
    if (!input) return;
    setValue("");
    await startTurn(input);
  }, [startTurn, value]);
  return { setValue, submit, value };
}

export function useAgentRunSettings() {
  const { dispatch, state } = useAgentContext();
  const runSettings = selectRunSettings(state);
  const selectedModel = state.models.models.find(
    (model) => model.id === runSettings.modelId,
  );
  const supportedEfforts =
    selectedModel?.supportedEfforts && selectedModel.supportedEfforts.length > 0
      ? selectedModel.supportedEfforts
      : DEFAULT_EFFORTS;

  const setExecutionMode = useCallback(
    (executionMode: ExecutionModeId) =>
      dispatch({ executionMode, type: "runSettings/updated" }),
    [dispatch],
  );
  const setModelId = useCallback(
    (modelId: string) => {
      const model = state.models.models.find((candidate) => candidate.id === modelId);
      dispatch({
        effort: model?.defaultEffort,
        modelId,
        type: "runSettings/updated",
      });
    },
    [dispatch, state.models.models],
  );
  const setEffort = useCallback(
    (effort: ReasoningEffort) => dispatch({ effort, type: "runSettings/updated" }),
    [dispatch],
  );

  return {
    executionModes: AGENT_EXECUTION_MODES,
    models: state.models.models,
    runSettings,
    selectedModel,
    setEffort,
    setExecutionMode,
    setModelId,
    supportedEfforts,
  };
}

export function useAgentAuth() {
  const { dispatch, state, transport } = useAgentContext();
  const readAccount = useCallback(async () => {
    const account = await transport.request("account/read");
    dispatch({ account, type: "account/updated" });
    return account;
  }, [dispatch, transport]);
  const login = useCallback(async () => {
    const raw = await transport.request<Record<string, unknown>, any>("account/login/start", {
      method: "chatgptDeviceCode",
    });
    const loginState = {
      userCode: raw?.userCode ?? raw?.user_code,
      verificationUrl: raw?.verificationUrl ?? raw?.verification_url,
    };
    dispatch({
      type: "account/login/deviceCodeStarted",
      userCode: loginState.userCode,
      verificationUrl: loginState.verificationUrl,
    });
    return loginState;
  }, [dispatch, transport]);
  const logout = useCallback(async () => transport.request("account/logout"), [transport]);
  return { account: state.account, login, logout, readAccount };
}

export function useAgentUsage() {
  const { dispatch, state, transport } = useAgentContext();
  const refreshUsage = useCallback(async () => {
    const response = await transport.request("account/rateLimits/read", {});
    dispatch({ rateLimits: response, type: "account/rateLimits/updated" });
    return response;
  }, [dispatch, transport]);
  return { rateLimits: state.account.rateLimits, refreshUsage };
}

export function useAgentModels() {
  const { dispatch, state, transport } = useAgentContext();
  const refreshModels = useCallback(async () => {
    const response = await transport.request("model/list", {});
    const rawModels = Array.isArray((response as any)?.data)
      ? (response as any).data
      : Array.isArray((response as any)?.models)
      ? (response as any).models
      : Array.isArray(response)
        ? response
        : [];
    const models = rawModels.map((model: any) => ({
      id: String(model.id ?? model.slug ?? model.name),
      defaultEffort: model.defaultReasoningEffort ?? model.default_effort,
      name: model.name ?? model.displayName ?? model.model,
      raw: model,
      supportedEfforts: normalizeSupportedEfforts(model),
    }));
    dispatch({ models, type: "models/updated" });
    return models;
  }, [dispatch, transport]);
  return { models: state.models.models, refreshModels };
}

function normalizeSupportedEfforts(model: Record<string, unknown>): AgentModel["supportedEfforts"] {
  const efforts = model.supportedReasoningEfforts ?? model.supported_reasoning_efforts;
  if (!Array.isArray(efforts)) return undefined;
  return efforts
    .map((effort) =>
      typeof effort === "string"
        ? effort
        : typeof effort === "object" && effort !== null
          ? String((effort as Record<string, unknown>).reasoningEffort ?? "")
          : "",
    )
    .filter(Boolean);
}
