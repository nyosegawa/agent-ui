import {
  selectActiveThread,
  selectOrderedTurns,
  selectPendingApprovals,
  selectThread,
  type RequestId,
  type ThreadId,
} from "@nyosegawa/agent-ui-core";
import { useCallback, useMemo, useState } from "react";
import { useAgentContext } from "./provider";

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
      const result = await transport.request("thread/resume", { ...params, threadId: id });
      dispatch({ threadId: id, type: "thread/active/set" });
      return result;
    },
    [dispatch, transport],
  );

  return { resumeThread, startThread, thread, threadId: resolvedThreadId, turns };
}

export function useAgentTurn(threadId?: ThreadId) {
  const { state, transport } = useAgentContext();
  const resolvedThreadId = threadId ?? state.activeThreadId;

  const startTurn = useCallback(
    async (input: string, params?: Record<string, unknown>) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      return transport.request("turn/start", {
        ...params,
        input,
        threadId: resolvedThreadId,
      });
    },
    [resolvedThreadId, transport],
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

export function useAgentModels() {
  const { dispatch, state, transport } = useAgentContext();
  const refreshModels = useCallback(async () => {
    const response = await transport.request("model/list", {});
    const rawModels = Array.isArray((response as any)?.models)
      ? (response as any).models
      : Array.isArray(response)
        ? response
        : [];
    const models = rawModels.map((model: any) => ({
      id: String(model.id ?? model.slug ?? model.name),
      name: model.name ?? model.displayName,
      raw: model,
    }));
    dispatch({ models, type: "models/updated" });
    return models;
  }, [dispatch, transport]);
  return { models: state.models.models, refreshModels };
}
