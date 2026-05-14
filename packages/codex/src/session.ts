import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  accountReadParams,
  appsListParams,
  cancelLoginParams,
  deviceCodeLoginParams,
  hooksListParams,
  modelListParams,
  skillsConfigWriteParams,
  skillsListParams,
  threadArchiveParams,
  threadCompactStartParams,
  threadForkParams,
  threadInjectItemsParams,
  threadListParams,
  threadLoadedListParams,
  threadMetadataUpdateParams,
  threadReadParams,
  threadResumeParams,
  threadRollbackParams,
  threadSetNameParams,
  threadStartParams,
  threadUnarchiveParams,
  threadUnsubscribeParams,
  turnInterruptParams,
  turnStartParams,
  turnSteerParams,
} from "./request-builders";
import type {
  AppsListParams,
  CancelLoginAccountParams,
  GetAccountParams,
  HooksListParams,
  LoginAccountParams,
  ModelListParams,
  SkillsConfigWriteParams,
  SkillsListParams,
  ThreadArchiveParams,
  ThreadCompactStartParams,
  ThreadForkParams,
  ThreadInjectItemsParams,
  ThreadListParams,
  ThreadLoadedListParams,
  ThreadMetadataUpdateParams,
  ThreadReadParams,
  ThreadResumeParams,
  ThreadRollbackParams,
  ThreadSetNameParams,
  ThreadStartParams,
  ThreadUnarchiveParams,
  ThreadUnsubscribeParams,
  TurnInterruptParams,
  TurnStartParams,
  TurnSteerParams,
  UserInput,
} from "./generated/stable/v2";

export interface CodexSessionOptions {
  experimental?: boolean;
}

export interface CodexSession {
  account: {
    cancelLogin(loginId: string): Promise<unknown>;
    loginDeviceCode(): Promise<unknown>;
    logout(): Promise<unknown>;
    read(refreshToken?: boolean): Promise<unknown>;
    rateLimitsRead(): Promise<unknown>;
  };
  apps: {
    list(params?: AppsListParams): Promise<unknown>;
  };
  hooks: {
    list(params?: HooksListParams): Promise<unknown>;
  };
  requestExperimental<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult>;
  skills: {
    configWrite(params: SkillsConfigWriteParams): Promise<unknown>;
    list(params?: SkillsListParams): Promise<unknown>;
  };
  thread: {
    archive(threadId: string): Promise<unknown>;
    compactStart(threadId: string): Promise<unknown>;
    fork(
      threadId: string,
      params?: Omit<ThreadForkParams, "threadId">,
    ): Promise<unknown>;
    injectItems(
      threadId: string,
      items: ThreadInjectItemsParams["items"],
    ): Promise<unknown>;
    list(params?: ThreadListParams): Promise<unknown>;
    loadedList(params?: ThreadLoadedListParams): Promise<unknown>;
    metadataUpdate(
      threadId: string,
      params?: Omit<ThreadMetadataUpdateParams, "threadId">,
    ): Promise<unknown>;
    read(threadId: string, includeTurns?: boolean): Promise<unknown>;
    resume(
      threadId: string,
      params?: Omit<ThreadResumeParams, "threadId">,
    ): Promise<unknown>;
    rollback(threadId: string, numTurns: number): Promise<unknown>;
    setName(threadId: string, name: string): Promise<unknown>;
    start(params?: ThreadStartParams): Promise<unknown>;
    unarchive(threadId: string): Promise<unknown>;
    unsubscribe(threadId: string): Promise<unknown>;
  };
  turn: {
    interrupt(threadId: string, turnId: string): Promise<unknown>;
    start(
      params: { input: string | UserInput[]; threadId: string } & Omit<
        TurnStartParams,
        "input" | "threadId"
      >,
    ): Promise<unknown>;
    steer(params: {
      expectedTurnId: string;
      input: string | UserInput[];
      threadId: string;
    }): Promise<unknown>;
  };
  models: {
    list(params?: ModelListParams): Promise<unknown>;
  };
}

export function createCodexSession(
  transport: AgentTransport,
  options: CodexSessionOptions = {},
): CodexSession {
  return {
    account: {
      cancelLogin: (loginId) =>
        request<CancelLoginAccountParams>(transport, "account/login/cancel", cancelLoginParams(loginId)),
      loginDeviceCode: () =>
        request<LoginAccountParams>(transport, "account/login/start", deviceCodeLoginParams()),
      logout: () => request(transport, "account/logout"),
      rateLimitsRead: () => request(transport, "account/rateLimits/read"),
      read: (refreshToken) =>
        request<GetAccountParams>(transport, "account/read", accountReadParams(refreshToken)),
    },
    apps: {
      list: (params) => request<AppsListParams>(transport, "app/list", appsListParams(params)),
    },
    hooks: {
      list: (params) => request<HooksListParams>(transport, "hooks/list", hooksListParams(params)),
    },
    models: {
      list: (params) => request<ModelListParams>(transport, "model/list", modelListParams(params)),
    },
    requestExperimental: async (method, params) => {
      if (!options.experimental) {
        throw new Error(`Experimental Codex method requires opt-in: ${method}`);
      }
      if (method === "thread/turns/items/list") {
        throw new Error("thread/turns/items/list is disabled until upstream implements it");
      }
      return transport.request(method, params);
    },
    skills: {
      configWrite: (params) =>
        request<SkillsConfigWriteParams>(transport, "skills/config/write", skillsConfigWriteParams(params)),
      list: (params) => request<SkillsListParams>(transport, "skills/list", skillsListParams(params)),
    },
    thread: {
      archive: (threadId) =>
        request<ThreadArchiveParams>(transport, "thread/archive", threadArchiveParams(threadId)),
      compactStart: (threadId) =>
        request<ThreadCompactStartParams>(
          transport,
          "thread/compact/start",
          threadCompactStartParams(threadId),
        ),
      fork: (threadId, params) =>
        request<ThreadForkParams>(transport, "thread/fork", threadForkParams(threadId, params)),
      injectItems: (threadId, items) =>
        request<ThreadInjectItemsParams>(
          transport,
          "thread/inject_items",
          threadInjectItemsParams(threadId, items),
        ),
      list: (params) =>
        request<ThreadListParams>(transport, "thread/list", threadListParams(params)),
      loadedList: (params) =>
        request<ThreadLoadedListParams>(
          transport,
          "thread/loaded/list",
          threadLoadedListParams(params),
        ),
      metadataUpdate: (threadId, params) =>
        request<ThreadMetadataUpdateParams>(
          transport,
          "thread/metadata/update",
          threadMetadataUpdateParams(threadId, params),
        ),
      read: (threadId, includeTurns) =>
        request<ThreadReadParams>(
          transport,
          "thread/read",
          threadReadParams(threadId, includeTurns),
        ),
      resume: (threadId, params) =>
        request<ThreadResumeParams>(
          transport,
          "thread/resume",
          threadResumeParams(threadId, params),
        ),
      rollback: (threadId, numTurns) =>
        request<ThreadRollbackParams>(
          transport,
          "thread/rollback",
          threadRollbackParams(threadId, numTurns),
        ),
      setName: (threadId, name) =>
        request<ThreadSetNameParams>(
          transport,
          "thread/name/set",
          threadSetNameParams(threadId, name),
        ),
      start: (params) =>
        request<ThreadStartParams>(transport, "thread/start", threadStartParams(params)),
      unarchive: (threadId) =>
        request<ThreadUnarchiveParams>(
          transport,
          "thread/unarchive",
          threadUnarchiveParams(threadId),
        ),
      unsubscribe: (threadId) =>
        request<ThreadUnsubscribeParams>(
          transport,
          "thread/unsubscribe",
          threadUnsubscribeParams(threadId),
        ),
    },
    turn: {
      interrupt: (threadId, turnId) =>
        request<TurnInterruptParams>(
          transport,
          "turn/interrupt",
          turnInterruptParams(threadId, turnId),
        ),
      start: (params) =>
        request<TurnStartParams>(transport, "turn/start", turnStartParams(params)),
      steer: (params) =>
        request<TurnSteerParams>(transport, "turn/steer", turnSteerParams(params)),
    },
  };
}

function request<TParams>(
  transport: AgentTransport,
  method: string,
  params?: TParams,
): Promise<unknown> {
  return params === undefined ? transport.request(method) : transport.request(method, params);
}
