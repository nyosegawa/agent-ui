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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  accountReadParams,
  cancelLoginParams,
  deviceCodeLoginParams,
  modelListParams,
  threadListParams,
  threadReadParams,
  threadResumeParams,
  threadStartParams,
  turnStartParams,
  type CancelLoginAccountParams,
  type GetAccountParams,
  type LoginAccountParams,
  type ModelListParams,
  type ThreadListParams,
  type ThreadReadParams,
  type ThreadResumeParams,
  type ThreadStartParams,
  type TurnStartParams,
} from "./codex-request-params";
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
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
    },
  },
  {
    description: "Run in the workspace and ask only after a command fails.",
    id: "auto",
    label: "Auto",
    turnParams: {
      approvalPolicy: "on-failure",
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
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

export function useAgentThread(threadId?: ThreadId) {
  const { dispatch, state, transport } = useAgentContext();
  const resolvedThreadId = threadId ?? state.activeThreadId;
  const thread = resolvedThreadId
    ? selectThread(state, resolvedThreadId)
    : selectActiveThread(state);
  const turns = resolvedThreadId ? selectOrderedTurns(state, resolvedThreadId) : [];
  const runSettings = selectRunSettings(state);

  const startThread = useCallback(
    async (params?: Record<string, unknown>) => {
      const requestParams = threadStartParams({
        cwd: runSettings.cwd,
        modelId: runSettings.modelId,
        params,
      });
      const result = await transport.request<ThreadStartParams, any>(
        "thread/start",
        requestParams,
      );
      const rawThread = result.thread ?? result;
      dispatch({
        status: normalizeThreadStatus(rawThread.status ?? result.status),
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
    [dispatch, runSettings.cwd, runSettings.modelId, transport],
  );

  const resumeThread = useCallback(
    async (id: ThreadId, params?: Record<string, unknown>) => {
      const requestParams = threadResumeParams(id, params);
      const result = await transport.request<ThreadResumeParams, any>(
        "thread/resume",
        requestParams,
      );
      const rawThread = result?.thread ?? result;
      if (rawThread?.id) {
        for (const event of threadSnapshotEvents(rawThread, true)) dispatch(event);
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
        const requestParams = threadListParams(params);
        const response = await transport.request<ThreadListParams, any>(
          "thread/list",
          requestParams,
        );
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
      const requestParams = threadReadParams(threadId, options.includeTurns ?? true);
      const response = await transport.request<ThreadReadParams, any>(
        "thread/read",
        requestParams,
      );
      const rawThread = response?.thread ?? response;
      if (!hasThreadId(rawThread)) {
        throw new Error(`thread/read returned no thread for ${threadId}`);
      }
      for (const event of threadSnapshotEvents(rawThread, options.activate ?? true)) {
        dispatch(event);
      }
      return response;
    },
    [dispatch, transport],
  );
  return { readThread };
}

function hasThreadId(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" ||
    typeof record.threadId === "string" ||
    typeof record.thread_id === "string"
  );
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
      const requestParams = turnStartParams({
        cwd: runSettings.cwd,
        effort: runSettings.effort,
        executionParams: executionMode?.turnParams,
        input,
        modelId: runSettings.modelId,
        params,
        threadId: resolvedThreadId,
      });
      return transport.request<TurnStartParams>("turn/start", requestParams);
    },
    [
      resolvedThreadId,
      runSettings.cwd,
      runSettings.effort,
      runSettings.executionMode,
      runSettings.modelId,
      transport,
    ],
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
    async (requestId: RequestId, result: unknown = { decision: "accept" }) => {
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
  const selectedModel =
    state.models.models.find((model) => model.id === runSettings.modelId) ??
    state.models.models.find((model) => isDefaultModel(model));
  const supportedEfforts =
    selectedModel?.supportedEfforts && selectedModel.supportedEfforts.length > 0
      ? selectedModel.supportedEfforts
      : [];

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
  const setCwd = useCallback(
    (cwd: string) =>
      dispatch({ cwd: cwd.trim() || undefined, type: "runSettings/updated" }),
    [dispatch],
  );

  return {
    executionModes: AGENT_EXECUTION_MODES,
    models: state.models.models,
    runSettings,
    selectedModel,
    setCwd,
    setEffort,
    setExecutionMode,
    setModelId,
    supportedEfforts,
  };
}

export function useAgentAuth() {
  const { dispatch, state, transport } = useAgentContext();
  const readAccount = useCallback(async () => {
    const params = accountReadParams(false);
    const response = await transport.request<GetAccountParams, any>(
      "account/read",
      params,
    );
    const account =
      response && Object.prototype.hasOwnProperty.call(response, "account")
        ? response.account
        : response && Object.keys(response).length > 0
          ? response
          : null;
    dispatch({
      account,
      status: account == null ? "unauthenticated" : "authenticated",
      type: "account/updated",
    });
    return response;
  }, [dispatch, transport]);
  const login = useCallback(async () => {
    const params = deviceCodeLoginParams();
    const raw = await transport.request<LoginAccountParams, any>(
      "account/login/start",
      params,
    );
    const loginState = {
      loginId: raw?.loginId ?? raw?.login_id,
      userCode: raw?.userCode ?? raw?.user_code,
      verificationUrl: raw?.verificationUrl ?? raw?.verification_url,
    };
    dispatch({
      loginId: loginState.loginId,
      type: "account/login/deviceCodeStarted",
      userCode: loginState.userCode,
      verificationUrl: loginState.verificationUrl,
    });
    return loginState;
  }, [dispatch, transport]);
  const cancelLogin = useCallback(async () => {
    const loginId = state.account.login?.loginId;
    if (!loginId) return;
    const params = cancelLoginParams(loginId);
    await transport.request<CancelLoginAccountParams>("account/login/cancel", params);
    dispatch({ account: null, status: "unauthenticated", type: "account/updated" });
  }, [dispatch, state.account.login?.loginId, transport]);
  const logout = useCallback(async () => {
    const response = await transport.request("account/logout");
    dispatch({ account: null, status: "unauthenticated", type: "account/updated" });
    return response;
  }, [dispatch, transport]);
  return { account: state.account, cancelLogin, login, logout, readAccount };
}

export interface AgentBootstrapState {
  errors: Error[];
  isBootstrapping: boolean;
  status: "idle" | "loading" | "ready" | "error";
}

export function useAgentBootstrap(): AgentBootstrapState {
  const { state } = useAgentContext();
  const { readAccount } = useAgentAuth();
  const { refreshUsage } = useAgentUsage();
  const { refreshModels } = useAgentModels();
  const didBootstrap = useRef(false);
  const didAuthenticatedSync = useRef(false);
  const [bootstrap, setBootstrap] = useState<AgentBootstrapState>({
    errors: [],
    isBootstrapping: false,
    status: "idle",
  });

  useEffect(() => {
    if (state.connection.status !== "connected" || didBootstrap.current) return;
    didBootstrap.current = true;
    setBootstrap({ errors: [], isBootstrapping: true, status: "loading" });
    void (async () => {
      const errors: Error[] = [];
      let accountResponse: unknown;
      if (state.account.status === "unknown") {
        try {
          accountResponse = await readAccount();
        } catch (caught) {
          errors.push(caught instanceof Error ? caught : new Error(String(caught)));
        }
      }
      const isAuthenticated =
        state.account.status === "authenticated" ||
        accountResponseHasAccount(accountResponse);
      const tasks = [
        state.models.models.length === 0 ? refreshModels() : Promise.resolve(),
        isAuthenticated && state.account.rateLimits == null
          ? refreshUsage()
          : Promise.resolve(),
      ];
      const results = await Promise.allSettled(tasks);
      errors.push(
        ...results
          .filter(
            (result): result is PromiseRejectedResult => result.status === "rejected",
          )
          .map((result) =>
            result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason)),
          ),
      );
      setBootstrap({
        errors,
        isBootstrapping: false,
        status: errors.length > 0 ? "error" : "ready",
      });
      if (isAuthenticated && errors.length === 0) didAuthenticatedSync.current = true;
    })();
  }, [
    readAccount,
    refreshModels,
    refreshUsage,
    state.account.rateLimits,
    state.account.status,
    state.connection.status,
    state.models.models.length,
  ]);

  useEffect(() => {
    if (
      state.connection.status !== "connected" ||
      state.account.status !== "authenticated" ||
      didAuthenticatedSync.current
    ) {
      return;
    }
    didAuthenticatedSync.current = true;
    setBootstrap({ errors: [], isBootstrapping: true, status: "loading" });
    void (async () => {
      const errors: Error[] = [];
      const tasks = [
        state.account.account == null ? readAccount() : Promise.resolve(),
        state.models.models.length === 0 ? refreshModels() : Promise.resolve(),
        state.account.rateLimits == null ? refreshUsage() : Promise.resolve(),
      ];
      const results = await Promise.allSettled(tasks);
      errors.push(
        ...results
          .filter(
            (result): result is PromiseRejectedResult => result.status === "rejected",
          )
          .map((result) =>
            result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason)),
          ),
      );
      setBootstrap({
        errors,
        isBootstrapping: false,
        status: errors.length > 0 ? "error" : "ready",
      });
    })();
  }, [
    readAccount,
    refreshModels,
    refreshUsage,
    state.account.account,
    state.account.rateLimits,
    state.account.status,
    state.connection.status,
    state.models.models.length,
  ]);

  return bootstrap;
}

function accountResponseHasAccount(response: unknown): boolean {
  if (!response || typeof response !== "object") return false;
  const record = response as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, "account")) {
    return record.account != null;
  }
  return Object.keys(record).length > 0;
}

export function useAgentUsage() {
  const { dispatch, state, transport } = useAgentContext();
  const refreshUsage = useCallback(async () => {
    const response = await transport.request("account/rateLimits/read");
    dispatch({ rateLimits: response, type: "account/rateLimits/updated" });
    return response;
  }, [dispatch, transport]);
  return { rateLimits: state.account.rateLimits, refreshUsage };
}

export function useAgentModels() {
  const { dispatch, state, transport } = useAgentContext();
  const refreshModels = useCallback(async () => {
    const params = modelListParams();
    const response = await transport.request<ModelListParams, any>("model/list", params);
    const models = normalizeModelList(response);
    dispatch({ models, type: "models/updated" });
    return models;
  }, [dispatch, transport]);
  return { models: state.models.models, refreshModels };
}

function normalizeModelList(response: unknown): AgentModel[] {
  const value = response as any;
  const rawModels = Array.isArray(value?.data)
    ? value.data
    : Array.isArray(value?.models)
      ? value.models
      : Array.isArray(value)
        ? value
        : [];
  return rawModels
    .filter((model: unknown) => typeof model === "object" && model !== null)
    .map((model: Record<string, unknown>) => ({
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
      if (typeof effort !== "object" || effort === null) return undefined;
      const record = effort as Record<string, unknown>;
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

function isDefaultModel(model: AgentModel): boolean {
  return (
    typeof model.raw === "object" &&
    model.raw !== null &&
    (model.raw as Record<string, unknown>).isDefault === true
  );
}

function normalizeThreadStatus(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  const type = (value as Record<string, unknown>).type;
  if (type === "active") return "running";
  if (type === "idle") return "loaded";
  return typeof type === "string" ? type : undefined;
}
